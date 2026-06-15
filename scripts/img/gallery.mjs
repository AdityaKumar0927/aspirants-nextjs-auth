/**
 * Build a self-contained HTML gallery of the already-vector SVG images
 * (the ones PIL couldn't open because they were SVG, now stored via passthrough).
 *
 *   node scripts/img/gallery.mjs
 *
 * Identifies them from the download cache (SVG bytes), counts how many DB
 * questions reference each, and writes scripts/img/out/gallery-268.html
 * (SVGs inlined as data URIs, opens offline in any browser).
 */
import { PrismaClient } from "@prisma/client"
import { readFileSync, writeFileSync, readdirSync, existsSync, openSync, readSync, closeSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { canonicalKey, hashFor, URL_RE, isImageUrl } from "./canon.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..", "..")
const CACHE = resolve(__dirname, "out", "cache")
const QIMG = resolve(ROOT, "public", "q-img")
const MANIFEST = resolve(__dirname, "out", "manifest.json")

for (const l of readFileSync(resolve(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/)
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
}

const urlByHash = new Map(JSON.parse(readFileSync(MANIFEST, "utf8")).map((m) => [m.hash, m.url]))

function headBytes(path, n = 64) {
  const fd = openSync(path, "r")
  const b = Buffer.alloc(n)
  const got = readSync(fd, b, 0, n, 0)
  closeSync(fd)
  return b.subarray(0, got)
}
function isSvgHead(buf) {
  let i = 0
  while (i < buf.length && [0xef, 0xbb, 0xbf, 0x20, 0x09, 0x0a, 0x0d].includes(buf[i])) i++
  const head = buf.subarray(i, i + 64).toString("latin1").toLowerCase()
  return head.startsWith("<?xml") || head.startsWith("<svg") || head.startsWith("<!doctype svg")
}

// 1. Identify SVG-source hashes from the cache (only ones that produced an SVG).
const svgSet = new Set()
for (const f of readdirSync(CACHE)) {
  if (!f.endsWith(".img")) continue
  const h = f.slice(0, -4)
  if (!existsSync(resolve(QIMG, `${h}.svg`))) continue
  if (isSvgHead(headBytes(resolve(CACHE, f)))) svgSet.add(h)
}
console.error(`SVG-source images: ${svgSet.size}`)

// 2. Count DB questions referencing each.
const prisma = new PrismaClient()
const perHash = new Map([...svgSet].map((h) => [h, { count: 0, samples: [] }]))
const qWithSvg = new Set()
for (let skip = 0; ; skip += 1000) {
  const rows = await prisma.question.findMany({
    skip, take: 1000, orderBy: { id: "asc" },
    select: { questionId: true, exam: true, subject: true, topic: true, year: true, text: true, markscheme: true, diagramUrl: true, options: true, explanation: true },
  })
  if (!rows.length) break
  for (const r of rows) {
    const blob = JSON.stringify({ a: r.text, b: r.markscheme, c: r.diagramUrl, d: r.options, e: r.explanation })
    const here = new Set()
    for (const m of blob.matchAll(URL_RE)) {
      const u = m[0].replace(/[.,;]+$/, "")
      if (!isImageUrl(u)) continue
      const hh = hashFor(canonicalKey(u))
      if (svgSet.has(hh)) here.add(hh)
    }
    if (here.size) {
      qWithSvg.add(r.questionId)
      for (const hh of here) {
        const e = perHash.get(hh)
        e.count++
        if (e.samples.length < 3) e.samples.push({ qid: r.questionId, exam: r.exam, subject: r.subject, topic: r.topic, year: r.year })
      }
    }
  }
  process.stderr.write(`  scanned ${skip + rows.length}\r`)
}
await prisma.$disconnect()

// 3. Render.
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]))
const cards = [...svgSet].sort().map((h) => {
  let dataUri = ""
  try { dataUri = "data:image/svg+xml;base64," + readFileSync(resolve(QIMG, `${h}.svg`)).toString("base64") } catch {}
  const meta = perHash.get(h)
  const samp = meta.samples.map((s) => `${esc(s.exam || "-")} ${esc(s.year || "")} · ${esc(s.subject || "-")}/${esc(s.topic || "-")} <span class="qid">${esc(s.qid)}</span>`).join("<br>")
  return `<div class="card"><div class="img"><img loading="lazy" src="${dataUri}" alt="${h}"></div>
  <div class="meta"><div class="hash">${h}.svg</div>
  <div class="cnt">used in <b>${meta.count}</b> question${meta.count === 1 ? "" : "s"}</div>
  <div class="samp">${samp}</div>
  <div class="src"><a href="${esc(urlByHash.get(h) || "")}" target="_blank" rel="noopener">original source ↗</a></div></div></div>`
}).join("\n")

const html = `<!doctype html><html><head><meta charset="utf-8"><title>${svgSet.size} vector SVG images</title>
<style>
*{box-sizing:border-box}body{font-family:system-ui,Segoe UI,Arial,sans-serif;margin:0;background:#0f1115;color:#e6e6e6}
header{position:sticky;top:0;background:#171a21;padding:14px 20px;border-bottom:1px solid #2a2f3a;z-index:10}
header h1{margin:0 0 4px;font-size:17px}header p{margin:0;color:#9aa4b2;font-size:13px;max-width:900px}
header b{color:#fff}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px;padding:18px}
.card{background:#171a21;border-radius:10px;overflow:hidden;border:1px solid #2a2f3a;display:flex;flex-direction:column}
.img{background:#fff;display:flex;align-items:center;justify-content:center;height:170px;padding:8px}
.img img{max-width:100%;max-height:100%;object-fit:contain}
.meta{padding:8px 10px;font-size:11px;color:#c7cdd6}
.hash{font-family:ui-monospace,monospace;color:#7fb4ff;word-break:break-all;font-size:10px}
.cnt{margin:4px 0}.cnt b{color:#ffd479;font-size:13px}
.samp{color:#8b94a3;margin-top:4px;line-height:1.5}.qid{font-family:ui-monospace,monospace;color:#5b6472}
.src{margin-top:5px}.src a{color:#6fd3a0;text-decoration:none}
</style></head><body>
<header><h1>${svgSet.size} already-vector SVG images — recovered, not broken</h1>
<p>These were flagged as "failures" only because they were <b>already SVG</b> at the source (the image tracer can't open SVG). They're now stored verbatim and render fine. Together they appear across <b>${qWithSvg.size}</b> distinct questions in the database — so deleting them would remove ${qWithSvg.size} questions, not 268.</p></header>
<div class="grid">${cards}</div></body></html>`
writeFileSync(resolve(__dirname, "out", "gallery-268.html"), html)
console.error(`\nWrote scripts/img/out/gallery-268.html · ${svgSet.size} images · ${qWithSvg.size} distinct questions`)
