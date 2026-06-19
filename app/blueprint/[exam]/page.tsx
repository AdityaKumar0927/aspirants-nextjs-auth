import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import {
  getExamBlueprint,
  getExamArchetypes,
  listBlueprintExams,
  type ChapterStat,
  type Trend,
} from "@/lib/blueprint";
import { PaperEyebrow } from "@/components/desk";
import T from "@/components/i18n/T"
import { buildMetadata } from "@/lib/site-config";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  const exams = await listBlueprintExams();
  return exams.map((e) => ({ exam: e.exam }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ exam: string }>;
}) {
  const { exam } = await params;
  const bp = await getExamBlueprint(exam);
  if (!bp) return buildMetadata("Exam blueprint");
  const name = bp.displayName;
  const topSubjects = bp.subjects.slice(0, 3).map((s) => s.subject).join(", ");
  const span = `${bp.years[0]}–${bp.years[bp.years.length - 1]}`;
  return buildMetadata(`${name} blueprint — chapter-wise weightage & trends`, {
    description: `${name} previous-year analysis from ${bp.totalQuestions.toLocaleString(
      "en-IN"
    )} questions (${span}): chapter-wise weightage, the most repeated chapters, and what's trending. Top subjects: ${topSubjects}.`,
    alternates: { canonical: `/blueprint/${exam}` },
  });
}

function pct(x: number): string {
  return `${(x * 100).toFixed(1)}%`;
}

function WeightBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-rule" aria-hidden="true">
      <div
        className="h-full rounded-full bg-ballpoint"
        style={{ width: `${Math.max(2, Math.min(100, value * 100)).toFixed(1)}%` }}
      />
    </div>
  );
}

function TrendTag({ trend }: { trend: Trend }) {
  if (trend === "up")
    return (
      <span className="inline-flex items-center gap-1 type-data text-xs text-st-answered">
        <TrendingUp className="h-3.5 w-3.5" /> <T k="auto.examPage.rising" />
      </span>
    );
  if (trend === "down")
    return (
      <span className="inline-flex items-center gap-1 type-data text-xs text-pencil">
        <TrendingDown className="h-3.5 w-3.5" /> <T k="auto.examPage.easing" />
      </span>
    );
  return <span className="type-data text-xs text-pencil"><T k="auto.examPage.steady" /></span>;
}

const PER_SUBJECT_LIMIT = 12;

export default async function ExamBlueprintPage({
  params,
}: {
  params: Promise<{ exam: string }>;
}) {
  const { exam } = await params;
  const bp = await getExamBlueprint(exam);
  if (!bp) notFound();

  const archetypes = await getExamArchetypes(exam);

  const span = `${bp.years[0]}–${bp.years[bp.years.length - 1]}`;
  const maxSubjectShare = Math.max(...bp.subjects.map((s) => s.share), 0.0001);
  const maxYearCount = Math.max(...bp.byYear.map((y) => y.count), 1);

  // Headline: the chapters you can most reliably bank on.
  const reliable = [...bp.chapters]
    .filter((c) => c.yearsAppeared >= Math.min(3, bp.years.length) && c.count >= 5)
    .sort((a, b) =>
      b.recurrence === a.recurrence ? b.count - a.count : b.recurrence - a.recurrence
    )
    .slice(0, 6);

  const chaptersBySubject = bp.subjects.map((s) => ({
    subject: s.subject,
    chapters: bp.chapters.filter((c) => c.subject === s.subject),
  }));

  return (
    <div>
      <Link
        href="/blueprint"
        className="inline-flex items-center gap-1.5 text-sm text-pencil hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> <T k="auto.examPage.allBlueprints" />
      </Link>

      {/* Header */}
      <header className="mt-4">
        <PaperEyebrow><T k="auto.examPage.examBlueprint" /> {span}</PaperEyebrow>
        <h1 className="type-display mt-2 text-3xl text-ink sm:text-4xl">
          {bp.displayName}
        </h1>
        <p className="mt-3 max-w-2xl text-pencil">
          <T k="auto.examPage.what" /> {bp.displayName} <T k="auto.examPage.actuallyTestsMinedFrom" />{" "}
          <span className="type-data text-ink">
            {bp.totalQuestions.toLocaleString("en-IN")}
          </span>{" "}
          <T k="auto.examPage.pastPaperQuestionsAcross" /> {bp.years.length} <T k="auto.examPage.years" />
        </p>
      </header>

      {/* Stat strip */}
      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-4">
        {[
          { label: "Questions analysed", value: bp.totalQuestions.toLocaleString("en-IN") },
          { label: "Years covered", value: String(bp.years.length) },
          { label: "Subjects", value: String(bp.subjectCount) },
          { label: "Chapters mapped", value: String(bp.chapters.length) },
        ].map((s) => (
          <div key={s.label} className="bg-paper p-4">
            <dd className="type-data text-2xl text-ink">{s.value}</dd>
            <dt className="mt-0.5 text-xs text-pencil">{s.label}</dt>
          </div>
        ))}
      </dl>

      {/* Headline: most repeated chapters */}
      {reliable.length > 0 && (
        <section className="mt-12">
          <PaperEyebrow><T k="auto.examPage.bankOnThese" /></PaperEyebrow>
          <h2 className="type-display mt-1 text-xl text-ink"><T k="auto.examPage.mostRepeatedChapters" /></h2>
          <p className="mt-1 text-sm text-pencil">
            <T k="auto.examPage.chaptersThatShowUpIn" />
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reliable.map((c) => (
              <div key={`${c.subject}-${c.chapter}`} className="paper-sheet p-4">
                <p className="type-data text-[11px] uppercase tracking-[0.12em] text-pencil">
                  {c.subject}
                </p>
                <p className="mt-1 font-medium text-ink">{c.chapter}</p>
                <p className="mt-2 type-data text-sm text-ballpoint">
                  <T k="auto.examPage.appearedIn" /> {c.yearsAppeared} <T k="auto.examPage.of" /> {bp.years.length} <T k="auto.examPage.years2" />
                </p>
                <p className="mt-0.5 type-data text-xs text-pencil">
                  ~{c.perYear.toFixed(1)} <T k="auto.examPage.questionsPaper" /> {c.count} <T k="auto.examPage.total" />
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recurring question archetypes (ML-mined; empty until enrichment runs) */}
      {archetypes.length > 0 && (
        <section className="mt-12">
          <PaperEyebrow><T k="auto.examPage.theSettersRepeatThemselves" /></PaperEyebrow>
          <h2 className="type-display mt-1 text-xl text-ink">
            <T k="auto.examPage.recurringQuestionArchetypes" />
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-pencil">
            <T k="auto.examPage.templatesThePaperSettersReuse" />
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {archetypes.map((a) => (
              <div key={a.id} className="paper-sheet p-4">
                <div className="flex items-center gap-2">
                  <p className="type-data text-[11px] uppercase tracking-[0.12em] text-pencil">
                    {[a.subject, a.chapter].filter(Boolean).join(" · ") ||
                      "General"}
                  </p>
                  <span className="rounded-sm bg-ballpoint/10 px-1.5 py-0.5 type-data text-[10px] uppercase tracking-wide text-ballpoint">
                    {a.distinctYears} <T k="auto.examPage.yrs" />
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-ink">{a.label}</p>
                <p className="mt-2 type-data text-xs text-ballpoint">
                  <T k="auto.examPage.asked" /> {a.size} <T k="auto.examPage.times" />
                  {a.firstYear && a.lastYear
                    ? a.firstYear === a.lastYear
                      ? ` in ${a.firstYear}`
                      : `, ${a.firstYear}–${a.lastYear}`
                    : ""}
                  {a.years.length > 1
                    ? ` · across ${a.distinctYears} different papers`
                    : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Subject weightage */}
      <section className="mt-12">
        <PaperEyebrow><T k="auto.examPage.whereTheMarksAre" /></PaperEyebrow>
        <h2 className="type-display mt-1 text-xl text-ink"><T k="auto.examPage.subjectWeightage" /></h2>
        <div className="paper-sheet mt-4 divide-y divide-rule">
          {bp.subjects.map((s) => (
            <div key={s.subject} className="flex items-center gap-4 px-4 py-3">
              <span className="w-32 shrink-0 truncate text-sm text-ink sm:w-44">
                {s.subject}
              </span>
              <div className="flex-1">
                <WeightBar value={s.share / maxSubjectShare} />
              </div>
              <span className="w-16 shrink-0 text-right type-data text-sm text-ink">
                {pct(s.share)}
              </span>
              <span className="hidden w-24 shrink-0 text-right type-data text-xs text-pencil sm:block">
                {s.count} <T k="auto.examPage.qs" />
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Chapter weightage by subject */}
      <section className="mt-12">
        <PaperEyebrow><T k="auto.examPage.chapterWiseBreakdown" /></PaperEyebrow>
        <h2 className="type-display mt-1 text-xl text-ink"><T k="auto.examPage.everyChapterRanked" /></h2>
        <div className="mt-4 space-y-8">
          {chaptersBySubject.map(({ subject, chapters }) => {
            const shown = chapters.slice(0, PER_SUBJECT_LIMIT);
            const maxShare = Math.max(...chapters.map((c) => c.share), 0.0001);
            return (
              <div key={subject}>
                <h3 className="type-data mb-2 text-[11px] uppercase tracking-[0.14em] text-pencil">
                  {subject}
                </h3>
                <div className="paper-sheet divide-y divide-rule">
                  {shown.map((c: ChapterStat) => (
                    <div
                      key={c.chapter}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3"
                    >
                      <span className="min-w-0 flex-1 basis-48 truncate text-sm text-ink">
                        {c.chapter}
                      </span>
                      <div className="order-last w-full basis-full sm:order-none sm:w-auto sm:flex-1 sm:basis-32">
                        <WeightBar value={c.share / maxShare} />
                      </div>
                      <span className="w-14 text-right type-data text-sm text-ink">
                        {pct(c.share)}
                      </span>
                      <span className="w-24 text-right type-data text-xs text-pencil">
                        {c.yearsAppeared}/{bp.years.length} <T k="auto.examPage.yrs" />
                      </span>
                      <span className="w-16 text-right">
                        <TrendTag trend={c.trend} />
                      </span>
                    </div>
                  ))}
                </div>
                {chapters.length > PER_SUBJECT_LIMIT && (
                  <p className="mt-2 type-data text-xs text-pencil">
                    + {chapters.length - PER_SUBJECT_LIMIT} <T k="auto.examPage.moreChaptersIn" /> {subject}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Question-type mix + year coverage */}
      <section className="mt-12 grid gap-8 md:grid-cols-2">
        <div>
          <PaperEyebrow><T k="auto.examPage.format" /></PaperEyebrow>
          <h2 className="type-display mt-1 text-xl text-ink"><T k="auto.examPage.questionTypes" /></h2>
          <div className="paper-sheet mt-4 divide-y divide-rule">
            {bp.types.map((t) => (
              <div key={t.type} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-ink">{t.type}</span>
                <span className="type-data text-sm text-pencil">
                  {pct(t.count / bp.totalQuestions)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <PaperEyebrow><T k="auto.examPage.history" /></PaperEyebrow>
          <h2 className="type-display mt-1 text-xl text-ink"><T k="auto.examPage.questionsPerYear" /></h2>
          <div className="paper-sheet mt-4 space-y-2 p-4">
            {bp.byYear.map((y) => (
              <div key={y.year} className="flex items-center gap-3">
                <span className="w-12 shrink-0 type-data text-xs text-pencil">{y.year}</span>
                <div className="flex-1">
                  <WeightBar value={y.count / maxYearCount} />
                </div>
                <span className="w-10 shrink-0 text-right type-data text-xs text-ink">
                  {y.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-12">
        <div className="paper-sheet flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="type-display text-lg text-ink">
              <T k="auto.examPage.practise" /> {bp.displayName}<T k="auto.examPage.notTheWholeSyllabus" />
            </h2>
            <p className="mt-1 text-sm text-pencil">
              <T k="auto.examPage.drillTheHighWeightageChapters" />
            </p>
          </div>
          <Link
            href={`/question-bank?exam=${encodeURIComponent(bp.exam)}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-ballpoint px-5 text-sm font-medium text-paper transition-colors hover:bg-ballpoint/90"
          >
            <T k="auto.examPage.startPractising" /> <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
