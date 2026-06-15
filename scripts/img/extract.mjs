/**
 * Stage 1 (read-only): scan every question for image URLs and build a manifest
 * of UNIQUE images (deduping the fly/plain forms) plus where each occurs.
 *
 * Output: scripts/img/manifest.json — [{ key, hash, url, count }]
 * Nothing is downloaded or written to the DB here.
 *
 *   node scripts/img/extract.mjs
 */
import { PrismaClient } from "@prisma/client"
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { canonicalKey, downloadUrl, hashFor, URL_RE, isImageUrl } from "./canon.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..", "..")

function loadEnv() {
  try {
    for (const l of readFileSync(resolve(ROOT, ".env"), "utf8").split(/\r?\n/)) {
      const m = l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/)
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
    }
  } catch {}
}
loadEnv()

const prisma = new PrismaClient()
const manifest = new Map() // key -> { key, hash, url, count }

function collect(str) {
  if (!str) return
  for (const m of String(str).matchAll(URL_RE)) {
    const url = m[0].replace(/[.,;]+$/, "")
    if (!isImageUrl(url)) continue
    const key = canonicalKey(url)
    const entry = manifest.get(key) ?? { key, hash: hashFor(key), url: downloadUrl(key), count: 0 }
    entry.count++
    manifest.set(key, entry)
  }
}

const BATCH = 2000
let scanned = 0
for (let skip = 0; ; skip += BATCH) {
  const rows = await prisma.question.findMany({
    skip,
    take: BATCH,
    orderBy: { id: "asc" },
    select: { text: true, markscheme: true, diagramUrl: true, options: true, explanation: true },
  })
  if (!rows.length) break
  for (const r of rows) {
    collect(r.text)
    collect(r.markscheme)
    collect(r.diagramUrl)
    if (r.options?.length) collect(r.options.join(" \n "))
    if (r.explanation) collect(JSON.stringify(r.explanation))
  }
  scanned += rows.length
  process.stderr.write(`  scanned ${scanned}\r`)
}
await prisma.$disconnect()

const list = [...manifest.values()].sort((a, b) => b.count - a.count)
mkdirSync(resolve(__dirname, "out"), { recursive: true })
writeFileSync(resolve(__dirname, "out", "manifest.json"), JSON.stringify(list, null, 2) + "\n")

console.log(
  `\nUnique images: ${list.length}  ·  total occurrences: ${list.reduce((s, e) => s + e.count, 0)}`
)
console.log(`Manifest → scripts/img/out/manifest.json`)
