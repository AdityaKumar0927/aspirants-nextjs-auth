/**
 * Stage 2.5: push the traced SVGs (public/q-img) to a SEPARATE public GitHub
 * repo so jsDelivr serves them free — keeping them OUT of the app deploy.
 *
 * Prereq: create an empty PUBLIC repo on GitHub first (no README), e.g.
 *   https://github.com/AdityaKumar0927/aspirants-q-img
 *
 *   node scripts/img/push-cdn.mjs https://github.com/AdityaKumar0927/aspirants-q-img.git
 *
 * Prints the commit SHA + the jsDelivr base URL + the exact replace.mjs commands.
 * (public/q-img has its own nested git repo here; the app repo gitignores it.)
 */
import { execSync } from "node:child_process"
import { existsSync, readdirSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIR = resolve(__dirname, "..", "..", "public", "q-img")

const remote = process.argv[2]
if (!remote) {
  console.error("Usage: node scripts/img/push-cdn.mjs <git-remote-url>")
  process.exit(1)
}
if (!existsSync(DIR)) {
  console.error(`Not found: ${DIR} (run convert.py first)`)
  process.exit(1)
}

const count = readdirSync(DIR).filter((f) => f.endsWith(".svg")).length
console.log(`Pushing ${count} SVGs from public/q-img → ${remote}\n`)

const run = (cmd) => execSync(cmd, { cwd: DIR, stdio: "inherit" })
const cap = (cmd) => execSync(cmd, { cwd: DIR }).toString().trim()

if (!existsSync(resolve(DIR, ".git"))) run("git init -b main")
run("git add -A")
try {
  run('git -c user.name="aspirants" -c user.email="noreply@aspirants.tech" commit -m "Traced question SVGs"')
} catch {
  console.log("(nothing new to commit)")
}
try { run("git remote remove origin") } catch {}
run(`git remote add origin ${remote}`)
run("git push -u origin main --force")

const sha = cap("git rev-parse HEAD")
const m = remote.match(/github\.com[/:]([^/]+)\/([^/.]+)/)
const base = m
  ? `https://cdn.jsdelivr.net/gh/${m[1]}/${m[2]}@${sha}`
  : null

console.log(`\n✓ Pushed. Commit ${sha}`)
if (base) {
  console.log(`jsDelivr base (immutable, permanently cached): ${base}\n`)
  console.log("Rewrite the DB to point at it:")
  console.log(`  node scripts/img/replace.mjs --base "${base}"            # dry run`)
  console.log(`  node scripts/img/replace.mjs --base "${base}" --commit   # apply`)
} else {
  console.log("Could not derive the jsDelivr URL from the remote; build it as:")
  console.log(`  https://cdn.jsdelivr.net/gh/<owner>/<repo>@${sha}`)
}
