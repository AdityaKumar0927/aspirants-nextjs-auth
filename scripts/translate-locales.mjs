/**
 * Auto-translate the UI string catalog — FREE, no API key.
 *
 * Reads the English source of truth (locales/en/common.json) and translates it
 * into the supported Indian languages using Google Translate's free public web
 * endpoint (translate.googleapis.com/translate_a/single) — the same one the
 * Google Translate website uses. No key, no account, no paid AI. Results are
 * written to public/locales/<code>/common.json, exactly where the runtime
 * loader (components/i18n/i18n.ts → ensureLanguageLoaded) fetches them, so new
 * catalogs are picked up without code changes.
 *
 *   node scripts/translate-locales.mjs                 (all languages)
 *   node scripts/translate-locales.mjs --only hi,ta    (specific languages)
 *   node scripts/translate-locales.mjs --force         (overwrite existing)
 *
 * Notes:
 *  - The catalog is tiny and translated once, so the free endpoint is plenty.
 *    It is unofficial (Google ToS), so for a fully open-source path use
 *    LibreTranslate (self-host) or AI4Bharat IndicTrans2 / Meta NLLB instead.
 *  - Languages Google doesn't support (e.g. Bodo) are skipped and fall back to
 *    English automatically at runtime.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")

// our language code -> Google Translate code (null = unsupported -> skipped).
const GOOGLE_CODE = {
  hi: "hi", bn: "bn", te: "te", mr: "mr", ta: "ta", ur: "ur", gu: "gu",
  kn: "kn", or: "or", ml: "ml", pa: "pa", as: "as", mai: "mai", sat: "sat",
  ks: "ks", ne: "ne", kok: "gom", sd: "sd", doi: "doi", mni: "mni-Mtei",
  brx: null, sa: "sa",
}

const ARGS = process.argv.slice(2)
const FORCE = ARGS.includes("--force")
const onlyIx = ARGS.indexOf("--only")
const ONLY = onlyIx >= 0 && ARGS[onlyIx + 1] ? ARGS[onlyIx + 1].split(",").map((s) => s.trim()) : null

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* ---- flatten / unflatten nested JSON so we can translate leaf strings ---- */
function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out)
    else out[key] = v
  }
  return out
}
function unflatten(flat) {
  const out = {}
  for (const [path, val] of Object.entries(flat)) {
    const parts = path.split(".")
    let cur = out
    for (let i = 0; i < parts.length - 1; i++) {
      cur[parts[i]] ??= {}
      cur = cur[parts[i]]
    }
    cur[parts[parts.length - 1]] = val
  }
  return out
}

/* ---- keep {{placeholders}} and the brand name out of the translation ----
   Each protected chunk becomes a sentinel like ZZX0XZZ — an uppercase, no-space
   token Google leaves untouched, so it can't collide with digits that appear
   naturally in the translated text. */
function protect(text) {
  const tokens = []
  const stash = (m) => {
    tokens.push(m)
    return `ZZX${tokens.length - 1}XZZ`
  }
  const s = text.replace(/\{\{[^}]+\}\}/g, stash).replace(/Aspirants/g, stash)
  return { s, tokens }
}
function restore(text, tokens) {
  return text.replace(/ZZX(\d+)XZZ/g, (_, i) => tokens[Number(i)] ?? "")
}

async function gtranslate(text, tl, attempt = 0) {
  if (!text.trim()) return text
  const { s, tokens } = protect(text)
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en" +
    `&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(s)}`
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })
  if (res.status === 429 && attempt < 5) {
    await sleep(1500 * (attempt + 1))
    return gtranslate(text, tl, attempt + 1)
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const translated = (data[0] || []).map((seg) => seg[0]).join("")
  return restore(translated, tokens)
}

async function main() {
  const en = JSON.parse(readFileSync(resolve(ROOT, "locales/en/common.json"), "utf8"))
  const flat = flatten(en)
  const keys = Object.keys(flat)

  // Ship English statically too, so the loader treats all languages uniformly.
  const enOut = resolve(ROOT, "public/locales/en/common.json")
  mkdirSync(dirname(enOut), { recursive: true })
  writeFileSync(enOut, JSON.stringify(en, null, 2) + "\n")

  const entries = Object.entries(GOOGLE_CODE).filter(([code]) => !ONLY || ONLY.includes(code))
  for (const [code, gcode] of entries) {
    const outPath = resolve(ROOT, `public/locales/${code}/common.json`)
    if (!gcode) {
      console.log(`  skip ${code} (not supported by Google Translate; falls back to English)`)
      continue
    }
    if (existsSync(outPath) && !FORCE) {
      console.log(`  skip ${code} (exists; use --force to overwrite)`)
      continue
    }
    try {
      const outFlat = {}
      for (const k of keys) {
        const v = flat[k]
        outFlat[k] = typeof v === "string" ? await gtranslate(v, gcode) : v
        await sleep(80) // be gentle with the free endpoint
      }
      mkdirSync(dirname(outPath), { recursive: true })
      writeFileSync(outPath, JSON.stringify(unflatten(outFlat), null, 2) + "\n")
      console.log(`  ✓ ${code} (${gcode})`)
    } catch (e) {
      console.error(`  ✗ ${code}: ${e.message} (will fall back to English)`)
    }
  }
  console.log("Done. Catalogs in public/locales load at runtime — no rebuild needed.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
