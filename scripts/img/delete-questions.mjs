/**
 * Delete specific questions by questionId — backup-first, reversible content.
 *
 *   node scripts/img/delete-questions.mjs            # DRY RUN (backup + report)
 *   node scripts/img/delete-questions.mjs --commit   # actually delete
 *
 * Backs up the full Question rows (+ dependent-row counts that would cascade)
 * to scripts/img/out/deleted-questions.json before deleting anything.
 */
import { PrismaClient } from "@prisma/client"
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..", "..")
const OUT = resolve(__dirname, "out", "deleted-questions.json")
for (const l of readFileSync(resolve(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/)
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
}

const IDS = ["5a7c644f2c648", "kcqRiXeOvgtGgoSl"] // the 2 questions whose sole image is permanently dead
const COMMIT = process.argv.includes("--commit")
const prisma = new PrismaClient()

const rows = await prisma.question.findMany({ where: { questionId: { in: IDS } } })
if (!rows.length) {
  console.log("No matching questions found (already deleted?).")
  await prisma.$disconnect(); process.exit(0)
}

// dependent rows that would cascade-delete, for an honest backup/report
const deps = {}
for (const id of IDS) {
  deps[id] = {
    userAnswers: await prisma.userAnswer.count({ where: { questionId: id } }).catch(() => "n/a"),
    userProgress: await prisma.userProgress.count({ where: { questionId: id } }).catch(() => "n/a"),
    solutions: await prisma.solution.count({ where: { questionId: id } }).catch(() => "n/a"),
  }
}

writeFileSync(OUT, JSON.stringify({ deletedAt: null, ids: IDS, questions: rows, dependentCounts: deps }, null, 2) + "\n")
console.log(`Backed up ${rows.length} question row(s) → scripts/img/out/deleted-questions.json`)
for (const r of rows) {
  console.log(`  ${r.questionId}  ·  ${r.exam} ${r.year || ""}  ·  ${r.subject || "-"}/${r.topic || "-"}`)
  console.log(`     diagramUrl: ${r.diagramUrl || "(none)"}`)
  console.log(`     cascades → answers:${deps[r.questionId].userAnswers} progress:${deps[r.questionId].userProgress} solutions:${deps[r.questionId].solutions}`)
}

if (!COMMIT) {
  console.log("\nDRY RUN — nothing deleted. Re-run with --commit to delete.")
  await prisma.$disconnect(); process.exit(0)
}

const res = await prisma.question.deleteMany({ where: { questionId: { in: IDS } } })
console.log(`\nDeleted ${res.count} question(s) (dependents cascaded per schema).`)
await prisma.$disconnect()
