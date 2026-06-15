/**
 * i18n migration codemod — wraps hardcoded JSX text in <T k="…" /> automatically.
 *
 * Walks each file's TSX with the TypeScript compiler, finds literal JSX text
 * (the visible UI strings), replaces each with `<T k="auto.<file>.<slug>" />`,
 * records the English text into locales/en/common.json under the `auto`
 * namespace, and injects `import T from "@/components/i18n/T"`. <T/> works in
 * both server and client components, so no useTranslation hook injection is
 * needed. Run `npm run i18n:translate -- --force` afterwards to translate.
 *
 *   node scripts/i18n-migrate.mjs <file...>            (dry run — reports only)
 *   node scripts/i18n-migrate.mjs <file...> --write    (apply changes)
 *
 * Deliberately conservative: it skips math/code/preformatted subtrees, the
 * landing, already-migrated files, attributes, and anything that isn't plain
 * prose — so it under-wraps rather than risk breaking the build. Verify with
 * `tsc` + `eslint` after each batch; `git` makes any wrap trivially reversible.
 */
import ts from "typescript"
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve, relative } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")

const ARGS = process.argv.slice(2)
const WRITE = ARGS.includes("--write")
const FILES = ARGS.filter((a) => !a.startsWith("--"))

// JSX subtrees whose text must NOT be translated (math, code, preformatted).
const BLOCK_TAGS = new Set([
  "code", "pre", "script", "style", "kbd", "samp",
  "MathRenderer", "Latex", "InlineMath", "BlockMath", "MathJax", "Math", "Katex",
])
const BLOCK_CLASS = /katex|font-mono|hljs|whitespace-pre|tabular-nums|\bcode\b/
// Paths we never touch (landing is owner-protected; i18n internals are done).
const BLOCK_PATH = /[\\/](landing|i18n)[\\/]|\(public\)[\\/]page\.tsx$/

const ENTITIES = {
  "&amp;": "&", "&apos;": "'", "&quot;": '"', "&nbsp;": " ", "&lt;": "<", "&gt;": ">",
  "&rsquo;": "’", "&lsquo;": "‘", "&rdquo;": "”", "&ldquo;": "“",
  "&mdash;": "—", "&ndash;": "–", "&hellip;": "…", "&copy;": "©",
  "&reg;": "®", "&deg;": "°", "&times;": "×", "&middot;": "·",
}
const decodeEntities = (s) =>
  s.replace(/&[a-z]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m)

const looksTranslatable = (s) => {
  const letters = (s.match(/[A-Za-z]/g) || []).length
  if (letters < 2) return false
  if (/^[\d\s.,:;%+\-/()$#*]+$/.test(s)) return false // numbers/punctuation only
  return true
}

function slugify(text) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
  const s = words
    .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join("")
  return (s || "text").slice(0, 40)
}

function nsFor(file) {
  const rel = relative(ROOT, file).replace(/\\/g, "/").replace(/\.tsx?$/, "")
  const parts = rel.split("/").filter((p) => !/^\(.*\)$/.test(p) && p !== "app")
  const tail = parts.slice(-2).join("-")
  return slugify(tail.replace(/[^a-z0-9]/gi, " "))
}

function getClassName(opening, sf) {
  for (const attr of opening.attributes.properties) {
    if (
      ts.isJsxAttribute(attr) &&
      attr.name.getText(sf) === "className" &&
      attr.initializer &&
      ts.isStringLiteral(attr.initializer)
    ) {
      return attr.initializer.text
    }
  }
  return ""
}

function migrateFile(file) {
  if (BLOCK_PATH.test(file)) return { file, skipped: "protected path" }
  const src = readFileSync(file, "utf8")
  if (/from ["']@\/components\/i18n\/T["']|from ["']react-i18next["']/.test(src)) {
    return { file, skipped: "already uses i18n" }
  }

  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const ns = nsFor(file)
  const repls = [] // { start, end, text }
  const keysByText = new Map()
  const used = new Set()

  const visit = (node, blocked) => {
    let childBlocked = blocked
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node
      const tag = opening.tagName.getText(sf)
      const cls = getClassName(opening, sf)
      if (BLOCK_TAGS.has(tag) || BLOCK_CLASS.test(cls)) childBlocked = true
    }

    if (ts.isJsxText(node) && !blocked) {
      // Compute positions from the raw source slice [pos,end]; getStart() skips
      // JsxText leading whitespace, which would double-count and corrupt offsets.
      const raw = src.slice(node.pos, node.end)
      const trimmed = raw.trim()
      if (trimmed && looksTranslatable(trimmed)) {
        const value = decodeEntities(trimmed).replace(/\s+/g, " ")
        const lead = raw.length - raw.trimStart().length
        const trail = raw.length - raw.trimEnd().length
        const start = node.pos + lead
        const end = node.end - trail
        let key = keysByText.get(value)
        if (!key) {
          let slug = slugify(value)
          let candidate = slug
          let n = 2
          while (used.has(candidate)) candidate = `${slug}${n++}`
          used.add(candidate)
          key = `auto.${ns}.${candidate}`
          keysByText.set(value, key)
        }
        repls.push({ start, end, text: `<T k="${key}" />` })
      }
    }

    node.forEachChild((c) => visit(c, ts.isJsxElement(node) ? childBlocked : blocked))
  }
  visit(sf, false)

  if (!repls.length) return { file, count: 0 }

  // Inject the <T> import after the last top-level import — or, if there are no
  // imports, after the "use client"/"use server" directive so it stays first.
  let insertPos = 0
  let hasImports = false
  for (const n of sf.statements) {
    if (ts.isImportDeclaration(n)) {
      insertPos = n.end
      hasImports = true
    }
  }
  if (!hasImports) {
    const first = sf.statements[0]
    if (first && ts.isExpressionStatement(first) && ts.isStringLiteral(first.expression)) {
      insertPos = first.end
    }
  }
  repls.push({
    start: insertPos,
    end: insertPos,
    text: `\nimport T from "@/components/i18n/T"`,
  })

  // Apply end-to-start so offsets stay valid.
  repls.sort((a, b) => b.start - a.start)
  let out = src
  for (const r of repls) out = out.slice(0, r.start) + r.text + out.slice(r.end)

  const entries = Array.from(keysByText.entries()).map(([value, key]) => ({ key, value }))
  if (WRITE) writeFileSync(file, out)
  return { file, count: entries.length, entries }
}

function mergeCatalog(allEntries) {
  const path = resolve(ROOT, "locales/en/common.json")
  const cat = JSON.parse(readFileSync(path, "utf8"))
  cat.auto ??= {}
  for (const { key, value } of allEntries) {
    const parts = key.split(".") // auto.<ns>.<slug>
    const ns = parts[1]
    const slug = parts.slice(2).join(".")
    cat.auto[ns] ??= {}
    cat.auto[ns][slug] = value
  }
  if (WRITE) writeFileSync(path, JSON.stringify(cat, null, 2) + "\n")
}

function main() {
  if (!FILES.length) {
    console.error("Usage: node scripts/i18n-migrate.mjs <file...> [--write]")
    process.exit(1)
  }
  const all = []
  for (const f of FILES) {
    const abs = resolve(ROOT, f)
    try {
      const res = migrateFile(abs)
      if (res.skipped) {
        console.log(`  - ${relative(ROOT, abs)} (skipped: ${res.skipped})`)
      } else {
        console.log(`  ${WRITE ? "✓" : "•"} ${relative(ROOT, abs)} — ${res.count} string(s)`)
        if (res.entries) {
          all.push(...res.entries)
          if (!WRITE) for (const e of res.entries) console.log(`      ${e.key} = ${JSON.stringify(e.value)}`)
        }
      }
    } catch (e) {
      console.error(`  ✗ ${relative(ROOT, abs)}: ${e.message}`)
    }
  }
  if (all.length) mergeCatalog(all)
  console.log(
    WRITE
      ? `\nWrote ${all.length} keys. Now run: npm run i18n:translate -- --force`
      : `\nDry run — re-run with --write to apply.`
  )
}

main()
