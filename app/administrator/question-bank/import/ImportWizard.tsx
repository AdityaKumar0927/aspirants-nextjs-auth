"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import "katex/dist/katex.min.css";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import MathRenderer from "@/components/layout/MathRenderer";
import {
  QUESTION_TYPES,
  questionCreateSchema,
  type QuestionType,
} from "@/lib/validations/question";
import {
  batchPages,
  questionDedupeKey,
  renderAndExtract,
  type PageFigure,
} from "./pdf-utils";
import {
  findMathErrors,
  parseAnswerKey,
  reconcileAnswer,
} from "./review-utils";

const MAX_PAGES = 50;
const PAGES_PER_BATCH = 3;

/** Wire shape returned by /api/import/extract. */
interface ExtractedQuestionWire {
  questionNumber?: string | null;
  type: QuestionType;
  passage?: string | null;
  text: string;
  options?: string[];
  correctOption?: string | null;
  correctOptions?: string[] | null;
  answerText?: string | null;
  answerMin?: number | null;
  answerMax?: number | null;
  subject?: string | null;
  topic?: string | null;
  difficulty?: string | null;
  marks?: number | null;
  negMarks?: number | null;
  markscheme?: string | null;
  sourcePage: number;
  figureIds?: string[];
  confidence?: number;
  lowConfidenceFields?: string[];
  suspiciousInstructions?: boolean;
}

interface AttachedFigure {
  id: string;
  dataUrl: string;
}

interface DraftQuestion {
  localId: string;
  include: boolean;
  questionNumber: string | null;
  type: QuestionType;
  passage: string;
  text: string;
  options: string[];
  correctOption: string;
  correctOptions: string[];
  answerText: string;
  answerMin: string;
  answerMax: string;
  subject: string;
  topic: string;
  difficulty: string;
  marks: string;
  negMarks: string;
  markscheme: string;
  sourcePage: number;
  confidence: number;
  figures: AttachedFigure[];
  lowConfidenceFields: string[];
  suspicious: boolean;
  answerKeyNote: string;
  answerConflict: boolean;
}

interface PaperHints {
  exam: string;
  subject: string;
  year: string;
  answerKey: string;
}

type Step = "upload" | "processing" | "review" | "done";

const letterFor = (index: number) => String.fromCharCode(65 + index);

function toDraft(
  q: ExtractedQuestionWire,
  figurePool: Map<string, PageFigure>,
  hints: PaperHints
): DraftQuestion {
  const figures: AttachedFigure[] = (q.figureIds ?? [])
    .map((id) => {
      const fig = figurePool.get(id);
      return fig ? { id: fig.id, dataUrl: fig.dataUrl } : null;
    })
    .filter((f): f is AttachedFigure => f !== null);

  return {
    localId: crypto.randomUUID(),
    include: true,
    questionNumber: q.questionNumber ?? null,
    type: q.type,
    passage: q.passage ?? "",
    text: q.text,
    options: q.options ?? [],
    correctOption: q.correctOption ?? "",
    correctOptions: q.correctOptions ?? [],
    answerText: q.answerText ?? "",
    answerMin: q.answerMin != null ? String(q.answerMin) : "",
    answerMax: q.answerMax != null ? String(q.answerMax) : "",
    subject: q.subject ?? hints.subject,
    topic: q.topic ?? "",
    difficulty: q.difficulty ?? "",
    marks: q.marks != null ? String(q.marks) : "",
    negMarks: q.negMarks != null ? String(q.negMarks) : "",
    markscheme: q.markscheme ?? "",
    sourcePage: q.sourcePage,
    confidence: q.confidence ?? 0.5,
    figures,
    lowConfidenceFields: q.lowConfidenceFields ?? [],
    suspicious: q.suspiciousInstructions ?? false,
    answerKeyNote: "",
    answerConflict: false,
  };
}

/** Applies the parsed answer key to a freshly extracted draft (deterministic). */
function applyAnswerKey(
  draft: DraftQuestion,
  keyMap: Map<string, string>
): DraftQuestion {
  if (keyMap.size === 0 || !draft.questionNumber) return draft;
  const keyAnswer = keyMap.get(draft.questionNumber.trim());
  if (!keyAnswer) return draft;
  const { patch, note, conflict } = reconcileAnswer(
    {
      type: draft.type,
      correctOption: draft.correctOption,
      correctOptions: draft.correctOptions,
      answerText: draft.answerText,
    },
    keyAnswer
  );
  return { ...draft, ...patch, answerKeyNote: note, answerConflict: conflict };
}

const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));

/** Canonical create payload for a draft (validated by the shared Zod schema). */
function toPayload(d: DraftQuestion, hints: PaperHints) {
  const text = d.passage.trim() ? `${d.passage.trim()}\n\n${d.text}` : d.text;
  return {
    text,
    type: d.type,
    options: d.options.map((o) => o.trim()).filter(Boolean),
    correctOption: d.correctOption || null,
    correctOptions: d.correctOptions,
    answerText: d.answerText.trim() || null,
    answerMin: numOrNull(d.answerMin),
    answerMax: numOrNull(d.answerMax),
    exam: hints.exam.trim() || null,
    subject: d.subject.trim() || null,
    topic: d.topic.trim() || null,
    difficulty: d.difficulty.trim() || null,
    year: hints.year.trim() === "" ? null : Number(hints.year),
    marks: numOrNull(d.marks),
    negMarks: numOrNull(d.negMarks),
    markscheme: d.markscheme.trim() || null,
    status: "DRAFT" as const,
    customTags: ["pdf-import"],
  };
}

function validateDraft(d: DraftQuestion, hints: PaperHints): string[] {
  const parsed = questionCreateSchema.safeParse(toPayload(d, hints));
  if (parsed.success) return [];
  return parsed.error.issues.map((issue) =>
    issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message
  );
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? `Request to ${url} failed (HTTP ${res.status})`);
  }
  return res.json();
}

function positionOf(yCenter: number): "top" | "middle" | "bottom" {
  if (yCenter < 0.34) return "top";
  if (yCenter > 0.66) return "bottom";
  return "middle";
}

export default function ImportWizard() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [hints, setHints] = useState<PaperHints>({
    exam: "",
    subject: "",
    year: "",
    answerKey: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [progress, setProgress] = useState({ label: "", percent: 0 });
  const [drafts, setDrafts] = useState<DraftQuestion[]>([]);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [previewIds, setPreviewIds] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(
    null
  );
  const pageCountRef = useRef(0);
  const figuresByPageRef = useRef<Map<number, PageFigure[]>>(new Map());

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    multiple: false,
    onDrop: (accepted) => {
      if (accepted[0]) {
        setFile(accepted[0]);
        setError(null);
      }
    },
  });

  const updateDraft = (localId: string, patch: Partial<DraftQuestion>) =>
    setDrafts((ds) => ds.map((d) => (d.localId === localId ? { ...d, ...patch } : d)));

  const removeOption = (d: DraftQuestion, index: number) => {
    const removedLetter = letterFor(index);
    const remap = (letter: string): string | null => {
      if (letter === removedLetter) return null;
      const i = letter.charCodeAt(0) - 65;
      return i > index ? letterFor(i - 1) : letter;
    };
    updateDraft(d.localId, {
      options: d.options.filter((_, i) => i !== index),
      correctOption: remap(d.correctOption || "") ?? "",
      correctOptions: d.correctOptions
        .map(remap)
        .filter((l): l is string => l !== null),
    });
  };

  const validationByDraft = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const d of drafts) map.set(d.localId, validateDraft(d, hints));
    return map;
  }, [drafts, hints]);

  // Live LaTeX self-check: which math snippets in each draft fail to parse.
  const mathErrorsByDraft = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const d of drafts) {
      const errs = [
        ...findMathErrors(d.passage),
        ...findMathErrors(d.text),
        ...d.options.flatMap((o) => findMathErrors(o)),
      ];
      map.set(d.localId, errs);
    }
    return map;
  }, [drafts]);

  const included = drafts.filter((d) => d.include);
  const invalidIncludedCount = included.filter(
    (d) => (validationByDraft.get(d.localId) ?? []).length > 0
  ).length;

  async function startProcessing() {
    if (!file) return;
    setStep("processing");
    setError(null);
    setWarning(null);
    setDrafts([]);
    setTokensUsed(0);
    figuresByPageRef.current = new Map();

    try {
      const { pages, totalPagesInPdf } = await renderAndExtract(file, {
        maxPages: MAX_PAGES,
        onProgress: (done, total) =>
          setProgress({
            label: `Reading page ${done} of ${total} (text + figures)…`,
            percent: Math.round((done / total) * 33),
          }),
      });
      pageCountRef.current = pages.length;

      // Global figure pool (id -> figure) + per-page index for the review tray.
      const figurePool = new Map<string, PageFigure>();
      for (const p of pages) {
        figuresByPageRef.current.set(p.pageNumber, p.figures);
        for (const fig of p.figures) figurePool.set(fig.id, fig);
      }

      const textlessPages = pages.filter((p) => !p.hasTextLayer).length;
      if (totalPagesInPdf > pages.length) {
        setWarning(
          `This PDF has ${totalPagesInPdf} pages — only the first ${pages.length} were processed. Split larger papers into multiple files.`
        );
      } else if (textlessPages === pages.length && pages.length > 0) {
        setWarning(
          "No text layer found (looks like a scanned PDF) — extraction relies entirely on image OCR, so review answers carefully."
        );
      }

      const batches = batchPages(pages.length, PAGES_PER_BATCH);
      const keyMap = parseAnswerKey(hints.answerKey);
      const seen = new Set<string>();
      const collected: DraftQuestion[] = [];
      let tokens = 0;
      let failedBatches = 0;

      for (let i = 0; i < batches.length; i++) {
        setProgress({
          label: `Extracting questions — batch ${i + 1} of ${batches.length} (AI)…`,
          percent: 33 + Math.round((i / batches.length) * 66),
        });
        try {
          const data = await postJson("/api/import/extract", {
            pages: batches[i].map((n) => {
              const page = pages[n - 1];
              return {
                pageNumber: n,
                image: page.imageDataUrl,
                text: page.text.slice(0, 20_000),
                figures: page.figures.map((f) => ({
                  id: f.id,
                  position: positionOf(f.yCenter),
                })),
              };
            }),
            hints: {
              fileName: file.name,
              exam: hints.exam.trim() || undefined,
              subject: hints.subject.trim() || undefined,
              year: hints.year.trim() || undefined,
              answerKey: hints.answerKey.trim() || undefined,
            },
          });
          tokens += data.tokensUsed ?? 0;
          for (const q of (data.questions ?? []) as ExtractedQuestionWire[]) {
            const key = questionDedupeKey(q);
            if (seen.has(key)) continue;
            seen.add(key);
            collected.push(applyAnswerKey(toDraft(q, figurePool, hints), keyMap));
          }
        } catch (batchErr) {
          // One bad batch shouldn't kill the whole run.
          failedBatches++;
          console.error(`Batch ${i + 1} failed:`, batchErr);
        }
      }

      setTokensUsed(tokens);
      setDrafts(collected);
      setProgress({ label: "Done", percent: 100 });

      if (failedBatches > 0) {
        setWarning(
          `${failedBatches} of ${batches.length} page batches failed to extract and were skipped — you can re-run the import to retry them.`
        );
      }

      if (collected.length === 0) {
        setError(
          "No questions could be extracted from this PDF. Check that it is a question paper (not a syllabus/notes document) and try again."
        );
        setStep("upload");
      } else {
        setStep("review");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Processing failed");
      setStep("upload");
    }
  }

  async function handleImport() {
    if (!file || included.length === 0 || invalidIncludedCount > 0) return;
    setImporting(true);
    setError(null);

    try {
      const questions = [];
      for (const d of included) {
        // Upload attached figures first so question rows reference real URLs.
        const urls: string[] = [];
        for (const figure of d.figures) {
          const { url } = await postJson("/api/import/diagram", {
            image: figure.dataUrl,
          });
          urls.push(url);
        }
        const payload: ReturnType<typeof toPayload> & {
          diagramUrl?: string;
        } = toPayload(d, hints);
        if (urls.length > 0) {
          payload.diagramUrl = urls[0];
          if (urls.length > 1) {
            payload.text +=
              "\n\n" +
              urls
                .slice(1)
                .map((u, i) => `![Figure ${i + 2}](${u})`)
                .join("\n\n");
          }
        }
        questions.push(payload);
      }

      const res = await postJson("/api/questions/bulk", {
        fileName: file.name,
        pageCount: pageCountRef.current,
        tokensUsed,
        questions,
      });
      setResult({ created: res.created, skipped: res.skipped });
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  const togglePreview = (localId: string) =>
    setPreviewIds((ids) => {
      const next = new Set(ids);
      if (next.has(localId)) next.delete(localId);
      else next.add(localId);
      return next;
    });

  return (
    <div className="container mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Import Questions from PDF
          </h1>
          <p className="text-muted-foreground mt-1">
            Hybrid pipeline: the PDF text layer (exact prose) + page images
            (math &amp; layout) are read together, figures are extracted straight
            from the PDF, and an AI structures it into reviewable questions.
          </p>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/administrator/question-bank">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Question Bank
          </Link>
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {warning && (
        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{warning}</span>
        </div>
      )}

      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>1. Upload question paper</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              {...getRootProps()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
                isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }`}
            >
              <input {...getInputProps()} />
              <FileText className="h-10 w-10 text-gray-400" />
              {file ? (
                <p className="mt-3 font-medium">
                  {file.name}{" "}
                  <span className="text-muted-foreground">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </p>
              ) : (
                <p className="mt-3 text-muted-foreground">
                  Drag &amp; drop a PDF here, or click to select (max {MAX_PAGES}{" "}
                  pages)
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="hint-exam">Exam (optional)</Label>
                <Input
                  id="hint-exam"
                  placeholder="e.g. JEE Main"
                  value={hints.exam}
                  onChange={(e) => setHints({ ...hints, exam: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hint-subject">Subject (optional)</Label>
                <Input
                  id="hint-subject"
                  placeholder="e.g. Physics"
                  value={hints.subject}
                  onChange={(e) => setHints({ ...hints, subject: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hint-year">Year (optional)</Label>
                <Input
                  id="hint-year"
                  placeholder="e.g. 2024"
                  inputMode="numeric"
                  value={hints.year}
                  onChange={(e) => setHints({ ...hints, year: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hint-key">Answer key (optional)</Label>
              <Textarea
                id="hint-key"
                rows={3}
                placeholder={"Paste the answer key if you have one, e.g.\n1: C\n2: 4\n3: A,D"}
                value={hints.answerKey}
                onChange={(e) => setHints({ ...hints, answerKey: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                If the paper has no printed answers, paste the key here and the AI
                will match answers to questions by number.
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              Page images are sent to the configured AI provider for extraction.
              Imported questions are created as <Badge variant="outline">DRAFT</Badge>{" "}
              and only go live after review.
            </p>

            <Button onClick={startProcessing} disabled={!file}>
              <Upload className="mr-2 h-4 w-4" />
              Process PDF
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "processing" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="font-medium">{progress.label}</p>
            <Progress value={progress.percent} className="w-full max-w-md" />
            <p className="text-sm text-muted-foreground">
              Large papers take a few minutes — keep this tab open.
            </p>
          </CardContent>
        </Card>
      )}

      {step === "review" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Extracted <strong>{drafts.length}</strong> questions from{" "}
              <strong>{file?.name}</strong> ({pageCountRef.current} pages,{" "}
              {tokensUsed.toLocaleString()} tokens). Review and edit before
              importing.
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Start over
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing || included.length === 0 || invalidIncludedCount > 0}
              >
                {importing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Import {included.length} question{included.length === 1 ? "" : "s"} as
                drafts
              </Button>
            </div>
          </div>
          {invalidIncludedCount > 0 && (
            <p className="text-sm text-red-600">
              {invalidIncludedCount} included question
              {invalidIncludedCount === 1 ? " has" : "s have"} validation errors —
              fix or exclude them to import.
            </p>
          )}

          <div className="space-y-6">
            {drafts.map((d, index) => {
              const issues = validationByDraft.get(d.localId) ?? [];
              const mathErrors = mathErrorsByDraft.get(d.localId) ?? [];
              const showPreview = previewIds.has(d.localId);
              const attachedIds = new Set(d.figures.map((f) => f.id));
              const trayFigures = (
                figuresByPageRef.current.get(d.sourcePage) ?? []
              ).filter((f) => !attachedIds.has(f.id));
              return (
                <Card
                  key={d.localId}
                  className={
                    !d.include
                      ? "opacity-60"
                      : issues.length
                      ? "border-red-300"
                      : undefined
                  }
                >
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={d.include}
                        onCheckedChange={(v) =>
                          updateDraft(d.localId, { include: v === true })
                        }
                        aria-label="Include in import"
                      />
                      <CardTitle className="text-base">
                        Question {index + 1}
                        {d.questionNumber ? ` (paper #${d.questionNumber})` : ""}
                      </CardTitle>
                      <Badge variant="outline">page {d.sourcePage}</Badge>
                      {d.confidence < 0.7 && (
                        <Badge variant="destructive">
                          low confidence {(d.confidence * 100).toFixed(0)}%
                        </Badge>
                      )}
                      {d.suspicious && (
                        <Badge variant="destructive" title="The page contained text that looked like instructions aimed at an AI. It was transcribed as data — review carefully.">
                          ⚠ suspicious text
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        value={d.type}
                        onChange={(e) =>
                          updateDraft(d.localId, {
                            type: e.target.value as QuestionType,
                          })
                        }
                      >
                        {QUESTION_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePreview(d.localId)}
                      >
                        {showPreview ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Deterministic answer-key reconciliation result */}
                    {d.answerKeyNote && (
                      <div
                        className={`flex items-start gap-2 rounded-md border p-2 text-xs ${
                          d.answerConflict
                            ? "border-red-300 bg-red-50 text-red-800"
                            : "border-green-300 bg-green-50 text-green-800"
                        }`}
                      >
                        {d.answerConflict ? (
                          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        )}
                        <span>Answer key: {d.answerKeyNote}</span>
                      </div>
                    )}
                    {d.lowConfidenceFields.length > 0 && (
                      <p className="text-xs text-amber-700">
                        AI was unsure about: {d.lowConfidenceFields.join(", ")} — please verify.
                      </p>
                    )}
                    {mathErrors.length > 0 && (
                      <p className="text-xs text-amber-700">
                        {mathErrors.length} math expression
                        {mathErrors.length === 1 ? "" : "s"} may be malformed (e.g.{" "}
                        <code>{mathErrors[0]}</code>) — check the preview.
                      </p>
                    )}

                    {d.passage.trim() && (
                      <div className="space-y-1.5">
                        <Label>Passage / directions (shared)</Label>
                        <Textarea
                          value={d.passage}
                          rows={Math.min(6, Math.max(2, d.passage.split("\n").length))}
                          onChange={(e) =>
                            updateDraft(d.localId, { passage: e.target.value })
                          }
                        />
                      </div>
                    )}

                    {showPreview ? (
                      <div className="rounded-md border bg-muted/30 p-4 space-y-3">
                        {d.passage.trim() && (
                          <div className="text-sm text-muted-foreground">
                            <MathRenderer text={d.passage} />
                          </div>
                        )}
                        <div>
                          <MathRenderer text={d.text} />
                        </div>
                        {d.options.length > 0 && (
                          <ol className="space-y-1">
                            {d.options.map((opt, i) => {
                              const letter = letterFor(i);
                              const isCorrect =
                                d.correctOption === letter ||
                                d.correctOptions.includes(letter);
                              return (
                                <li
                                  key={i}
                                  className={
                                    isCorrect
                                      ? "font-semibold text-green-700"
                                      : undefined
                                  }
                                >
                                  {letter}. <MathRenderer text={opt} />
                                </li>
                              );
                            })}
                          </ol>
                        )}
                      </div>
                    ) : (
                      <Textarea
                        value={d.text}
                        rows={Math.min(10, Math.max(3, d.text.split("\n").length))}
                        onChange={(e) =>
                          updateDraft(d.localId, { text: e.target.value })
                        }
                      />
                    )}

                    {/* Attached figures */}
                    {d.figures.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {d.figures.map((figure) => (
                          <figure key={figure.id} className="relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={figure.dataUrl}
                              alt={`Figure ${figure.id}`}
                              className="max-h-40 rounded border"
                            />
                            <button
                              type="button"
                              title="Detach figure"
                              className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white"
                              onClick={() =>
                                updateDraft(d.localId, {
                                  figures: d.figures.filter(
                                    (f) => f.id !== figure.id
                                  ),
                                })
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </figure>
                        ))}
                      </div>
                    )}

                    {/* Unattached figures from this page (manual attach) */}
                    {trayFigures.length > 0 && (
                      <div className="rounded-md border border-dashed p-3">
                        <p className="mb-2 text-xs text-muted-foreground">
                          Other figures detected on page {d.sourcePage} — click to
                          attach:
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {trayFigures.map((fig) => (
                            <button
                              key={fig.id}
                              type="button"
                              className="group relative"
                              title="Attach figure"
                              onClick={() =>
                                updateDraft(d.localId, {
                                  figures: [
                                    ...d.figures,
                                    { id: fig.id, dataUrl: fig.dataUrl },
                                  ],
                                })
                              }
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={fig.dataUrl}
                                alt={`Figure ${fig.id}`}
                                className="max-h-28 rounded border opacity-70 group-hover:opacity-100"
                              />
                              <span className="absolute -right-2 -top-2 rounded-full bg-blue-600 p-1 text-white">
                                <ImagePlus className="h-3 w-3" />
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {(d.type === "Multiple Choice" ||
                      d.type === "Multiple Correct") && (
                      <div className="space-y-2">
                        <Label>
                          Options (
                          {d.type === "Multiple Choice"
                            ? "select the correct one"
                            : "tick all correct"}
                          )
                        </Label>
                        {d.options.map((opt, i) => {
                          const letter = letterFor(i);
                          return (
                            <div key={i} className="flex items-center gap-2">
                              {d.type === "Multiple Choice" ? (
                                <input
                                  type="radio"
                                  name={`correct-${d.localId}`}
                                  checked={d.correctOption === letter}
                                  onChange={() =>
                                    updateDraft(d.localId, { correctOption: letter })
                                  }
                                />
                              ) : (
                                <Checkbox
                                  checked={d.correctOptions.includes(letter)}
                                  onCheckedChange={(v) =>
                                    updateDraft(d.localId, {
                                      correctOptions:
                                        v === true
                                          ? [...d.correctOptions, letter]
                                          : d.correctOptions.filter(
                                              (l) => l !== letter
                                            ),
                                    })
                                  }
                                />
                              )}
                              <span className="w-5 text-sm font-medium">{letter}.</span>
                              <Input
                                value={opt}
                                onChange={(e) =>
                                  updateDraft(d.localId, {
                                    options: d.options.map((o, j) =>
                                      j === i ? e.target.value : o
                                    ),
                                  })
                                }
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOption(d, i)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={d.options.length >= 10}
                          onClick={() =>
                            updateDraft(d.localId, { options: [...d.options, ""] })
                          }
                        >
                          <Plus className="mr-1 h-4 w-4" /> Add option
                        </Button>
                      </div>
                    )}

                    {(d.type === "Integer" || d.type === "Subjective") && (
                      <div className="space-y-1.5">
                        <Label>
                          {d.type === "Integer"
                            ? "Answer (whole number)"
                            : "Model answer (optional)"}
                        </Label>
                        {d.type === "Integer" ? (
                          <Input
                            inputMode="numeric"
                            value={d.answerText}
                            onChange={(e) =>
                              updateDraft(d.localId, { answerText: e.target.value })
                            }
                          />
                        ) : (
                          <Textarea
                            rows={3}
                            value={d.answerText}
                            onChange={(e) =>
                              updateDraft(d.localId, { answerText: e.target.value })
                            }
                          />
                        )}
                      </div>
                    )}

                    {d.type === "Numerical" && (
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label>Answer</Label>
                          <Input
                            value={d.answerText}
                            onChange={(e) =>
                              updateDraft(d.localId, { answerText: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Accepted min</Label>
                          <Input
                            value={d.answerMin}
                            onChange={(e) =>
                              updateDraft(d.localId, { answerMin: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Accepted max</Label>
                          <Input
                            value={d.answerMax}
                            onChange={(e) =>
                              updateDraft(d.localId, { answerMax: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-5">
                      <div className="space-y-1.5">
                        <Label>Subject</Label>
                        <Input
                          value={d.subject}
                          onChange={(e) =>
                            updateDraft(d.localId, { subject: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Topic</Label>
                        <Input
                          value={d.topic}
                          onChange={(e) =>
                            updateDraft(d.localId, { topic: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Difficulty</Label>
                        <select
                          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                          value={d.difficulty}
                          onChange={(e) =>
                            updateDraft(d.localId, { difficulty: e.target.value })
                          }
                        >
                          <option value="">—</option>
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Marks</Label>
                        <Input
                          value={d.marks}
                          onChange={(e) =>
                            updateDraft(d.localId, { marks: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Neg. marks</Label>
                        <Input
                          value={d.negMarks}
                          onChange={(e) =>
                            updateDraft(d.localId, { negMarks: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Solution / markscheme (optional)</Label>
                      <Textarea
                        rows={2}
                        value={d.markscheme}
                        onChange={(e) =>
                          updateDraft(d.localId, { markscheme: e.target.value })
                        }
                      />
                    </div>

                    {d.include && issues.length > 0 && (
                      <ul className="list-disc rounded-md border border-red-200 bg-red-50 p-3 pl-7 text-sm text-red-700">
                        {issues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {step === "done" && result && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <div>
              <p className="text-lg font-semibold">
                Imported {result.created} question{result.created === 1 ? "" : "s"} as
                drafts
              </p>
              {result.skipped > 0 && (
                <p className="text-sm text-muted-foreground">
                  {result.skipped} duplicate{result.skipped === 1 ? " was" : "s were"}{" "}
                  skipped.
                </p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">
                Review them in the question bank (filter by status DRAFT) and
                activate when ready.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/administrator/question-bank">Open Question Bank</Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setDrafts([]);
                  setResult(null);
                  setStep("upload");
                }}
              >
                Import another PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
