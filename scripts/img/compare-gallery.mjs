/**
 * Side-by-side COLOUR (original) vs BLACK-ONLY (blackified) for the 268 vector
 * SVGs, so the filter result can be eyeballed. No DB needed — reads from disk.
 *
 *   node scripts/img/compare-gallery.mjs   ->  scripts/img/out/gallery-compare.html
 */
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..", "..")
const QIMG = resolve(ROOT, "public", "q-img")
const BAK = resolve(__dirname, "out", "svg-color-backup")
const hashes = JSON.parse(readFileSync(resolve(__dirname, "out", "svg-hashes.json"), "utf8"))

const uri = (p) => (existsSync(p) ? "data:image/svg+xml;base64," + readFileSync(p).toString("base64") : "")
const kb = (p) => (existsSync(p) ? (statSync(p).size / 1024).toFixed(1) : "?")

const cards = hashes.sort().map((h) => {
  const col = resolve(BAK, `${h}.svg`), blk = resolve(QIMG, `${h}.svg`)
  return `<div class="card"><div class="pair">
    <figure><img loading="lazy" src="${uri(col)}"><figcaption>colour · ${kb(col)} KB</figcaption></figure>
    <figure><img loading="lazy" src="${uri(blk)}"><figcaption>black · ${kb(blk)} KB</figcaption></figure>
  </div><div class="hash">${h}.svg</div></div>`
}).join("\n")

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Blackify: ${hashes.length} before/after</title>
<style>
*{box-sizing:border-box}body{font-family:system-ui,Segoe UI,Arial,sans-serif;margin:0;background:#0f1115;color:#e6e6e6}
header{position:sticky;top:0;background:#171a21;padding:14px 20px;border-bottom:1px solid #2a2f3a;z-index:10}
header h1{margin:0 0 4px;font-size:17px}header p{margin:0;color:#9aa4b2;font-size:13px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px;padding:18px}
.card{background:#171a21;border:1px solid #2a2f3a;border-radius:10px;overflow:hidden}
.pair{display:grid;grid-template-columns:1fr 1fr}
figure{margin:0;background:#fff;display:flex;flex-direction:column}
figure+figure{border-left:2px solid #2a2f3a}
figure img{width:100%;height:170px;object-fit:contain;padding:8px;background:#fff}
figcaption{font-size:10px;color:#555;background:#f1f3f6;text-align:center;padding:2px}
.hash{font-family:ui-monospace,monospace;color:#7fb4ff;font-size:10px;padding:6px 10px;word-break:break-all}
</style></head><body>
<header><h1>Blackify filter — ${hashes.length} diagrams, colour → black-only</h1>
<p>Left = original vector colour · Right = after your "keep only black elements" filter (BLACK_MAX_LUM=64, MAX_CHROMA=32, prune). Scan for any diagram where black-only dropped meaningful content.</p></header>
<div class="grid">${cards}</div></body></html>`
writeFileSync(resolve(__dirname, "out", "gallery-compare.html"), html)
console.log(`Wrote scripts/img/out/gallery-compare.html · ${hashes.length} pairs`)
