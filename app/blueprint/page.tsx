import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listBlueprintExams } from "@/lib/blueprint";
import { PaperEyebrow } from "@/components/desk";
import T from "@/components/i18n/T"

// Corpus changes slowly; rebuild daily.
export const revalidate = 86400;

export const metadata = {
  title: "Exam blueprints — what every exam actually tests | Penwise",
  description:
    "Free, data-driven blueprints for JEE, NEET, GATE and more — chapter-wise weightage, recurring concepts and year-over-year trends from real past papers.",
};

export default async function BlueprintIndexPage() {
  const exams = await listBlueprintExams();
  const totalQuestions = exams.reduce((s, e) => s + e.totalQuestions, 0);

  return (
    <div>
      <PaperEyebrow><T k="auto.blueprintPage.examIntelligence" /></PaperEyebrow>
      <h1 className="type-display mt-2 text-3xl text-ink sm:text-4xl">
        <T k="auto.blueprintPage.examBlueprints" />
      </h1>
      <p className="mt-3 max-w-2xl text-pencil">
        <T k="auto.blueprintPage.weMined" />{" "}
        <span className="type-data text-ink">
          {totalQuestions.toLocaleString("en-IN")}
        </span>{" "}
        <T k="auto.blueprintPage.pastPaperQuestionsToShow" /> <em><T k="auto.blueprintPage.actually" /></em> <T k="auto.blueprintPage.testsChapterWiseWeightageWhich" />
      </p>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {exams.map((exam) => (
          <Link
            key={exam.exam}
            href={`/blueprint/${exam.exam}`}
            className="paper-sheet group flex items-center justify-between gap-4 p-5 transition-colors hover:border-ballpoint"
          >
            <div className="min-w-0">
              <h2 className="type-display text-lg text-ink">{exam.displayName}</h2>
              <p className="mt-1 type-data text-xs text-pencil">
                {exam.totalQuestions.toLocaleString("en-IN")} <T k="auto.blueprintPage.questions" />{" "}
                {exam.subjectCount} <T k="auto.blueprintPage.subjects" /> {exam.years.length} <T k="auto.blueprintPage.years" />
                {exam.years[0]}–{exam.years[exam.years.length - 1]})
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-pencil transition-colors group-hover:text-ballpoint" />
          </Link>
        ))}
      </div>

      {exams.length === 0 && (
        <p className="mt-10 text-pencil">
          <T k="auto.blueprintPage.blueprintsAppearOnceAnExam" />
        </p>
      )}
    </div>
  );
}
