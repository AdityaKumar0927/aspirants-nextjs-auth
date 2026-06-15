/**
 * Stage 3: rewrite the DB so converted CDN images point at the local SVGs.
 *
 *   node scripts/img/replace.mjs            # DRY RUN (no writes) + backup
 *   node scripts/img/replace.mjs --commit   # actually update the database
 *
 * Safety:
 *  - Always writes a full backup of every affected question's original fields to
 *    scripts/img/out/backup.json BEFORE any change (run `... --restore` to revert).
 *  - Only rewrites a URL whose SVG actually exists in public/q-img (so it's safe
 *    to run mid-conversion — un-converted images are left untouched).
 *  - Dry run by default; nothing is written without --commit.
 */
import { PrismaClient } from "@prisma/client"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { canonicalKey, hashFor, URL_RE, isImageUrl } from "./canon.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..", "..")
const OUT = resolve(ROOT, "public", "q-img")
const BACKUP = resolve(__dirname, "out", "backup.json")

function loadEnv() {
  try {
    for (const l of readFileSync(resolve(ROOT, ".env"), "utf8").split(/\r?\n/)) {
      const m = l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/)
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
    }
  } catch {}
}
loadEnv()

const COMMIT = process.argv.includes("--commit")
const RESTORE = process.argv.includes("--restore")
// Where the SVGs are served from. Local default; pass a jsDelivr/CDN base for prod,
// e.g. --base "https://cdn.jsdelivr.net/gh/AdityaKumar0927/aspirants-q-img@<sha>"
const baseIdx = process.argv.indexOf("--base")
const BASE = baseIdx >= 0 && process.argv[baseIdx + 1]
  ? process.argv[baseIdx + 1].replace(/\/+$/, "")
  : "/q-img"
const prisma = new PrismaClient()

const svgExists = new Map()
function hasSvg(hash) {
  if (!svgExists.has(hash)) svgExists.set(hash, existsSync(resolve(OUT, `${hash}.svg`)))
  return svgExists.get(hash)
}

function rewrite(str) {
  if (typeof str !== "string" || !str) return { out: str, n: 0 }
  let n = 0
  const out = str.replace(URL_RE, (m) => {
    const url = m.replace(/[.,;]+$/, "")
    const tail = m.slice(url.length)
    if (!isImageUrl(url)) return m
    const hash = hashFor(canonicalKey(url))
    if (!hasSvg(hash)) return m
    n++
    return `${BASE}/${hash}.svg${tail}`
  })
  return { out, n }
}

async function restore() {
  if (!existsSync(BACKUP)) throw new Error("No backup.json to restore from.")
  const rows = JSON.parse(readFileSync(BACKUP, "utf8"))
  console.log(`Restoring ${rows.length} questions from backup…`)
  for (const r of rows) {
    const { questionId, ...data } = r
    await prisma.question.update({ where: { questionId }, data }).catch((e) =>
      console.error(`  ! ${questionId}: ${e.message}`)
    )
  }
  console.log("Restore complete.")
  await prisma.$disconnect()
}

async function main() {
  if (RESTORE) return restore()

  const backup = []
  const updates = []
  let scanned = 0
  let totalRepl = 0
  const samples = []

  const BATCH = 1000
  for (let skip = 0; ; skip += BATCH) {
    const rows = await prisma.question.findMany({
      skip,
      take: BATCH,
      orderBy: { id: "asc" },
      select: {
        questionId: true,
        text: true,
        markscheme: true,
        diagramUrl: true,
        options: true,
        explanation: true,
      },
    })
    if (!rows.length) break

    for (const r of rows) {
      const data = {}
      const orig = {}
      let count = 0

      for (const field of ["text", "markscheme", "diagramUrl"]) {
        const { out, n } = rewrite(r[field])
        if (n) {
          data[field] = out
          orig[field] = r[field]
          count += n
        }
      }
      if (r.options?.length) {
        let any = 0
        const newOpts = r.options.map((o) => {
          const { out, n } = rewrite(o)
          any += n
          return out
        })
        if (any) {
          data.options = newOpts
          orig.options = r.options
          count += any
        }
      }
      if (r.explanation != null) {
        const { out, n } = rewrite(JSON.stringify(r.explanation))
        if (n) {
          try {
            data.explanation = JSON.parse(out)
            orig.explanation = r.explanation
            count += n
          } catch {
            /* leave explanation untouched if it wouldn't re-parse */
          }
        }
      }

      if (count) {
        backup.push({ questionId: r.questionId, ...orig })
        updates.push({ questionId: r.questionId, data })
        totalRepl += count
        if (samples.length < 3 && data.diagramUrl) {
          samples.push({ q: r.questionId, before: orig.diagramUrl, after: data.diagramUrl })
        }
      }
    }
    scanned += rows.length
    process.stderr.write(`  scanned ${scanned}\r`)
  }

  mkdirSync(resolve(__dirname, "out"), { recursive: true })
  writeFileSync(BACKUP, JSON.stringify(backup, null, 2) + "\n")

  console.log(`\nQuestions to update: ${updates.length}  ·  URL replacements: ${totalRepl}`)
  console.log(`Backup of originals → scripts/img/out/backup.json`)
  if (samples.length) {
    console.log("\nSample diagramUrl rewrites:")
    for (const s of samples) console.log(`  ${s.q}\n    ${s.before}\n    → ${s.after}`)
  }

  if (!COMMIT) {
    console.log("\nDRY RUN — nothing written. Re-run with --commit to apply.")
    await prisma.$disconnect()
    return
  }

  console.log("\nCommitting…")
  let ok = 0
  let failed = 0
  const stillFailing = []
  for (const u of updates) {
    let saved = false
    // Neon (serverless pooler) drops connections intermittently under thousands
    // of rapid writes; retry with backoff so a transient drop self-heals instead
    // of silently leaving the row on the old CDN.
    for (let attempt = 0; attempt < 5 && !saved; attempt++) {
      try {
        await prisma.question.update({ where: { questionId: u.questionId }, data: u.data })
        saved = true
      } catch (e) {
        if (attempt === 4) {
          console.error(`  ! ${u.questionId}: ${e.message || e.code || "unknown error"}`)
          stillFailing.push(u.questionId)
        } else {
          await new Promise((r) => setTimeout(r, 600 * (attempt + 1)))
        }
      }
    }
    if (saved) ok++
    else failed++
    if ((ok + failed) % 200 === 0)
      process.stderr.write(`  ${ok + failed}/${updates.length}  (ok ${ok}, fail ${failed})\r`)
  }
  console.log(`\nCommitted ${ok}/${updates.length}  ·  failed ${failed}.`)
  if (stillFailing.length)
    writeFileSync(resolve(__dirname, "out", "still-failing.json"), JSON.stringify(stillFailing, null, 2) + "\n")
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
