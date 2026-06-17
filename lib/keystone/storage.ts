/**
 * Keystone — client-only persistence (localStorage).
 *
 * The whole MVP runs without a server or an account: the questionnaire answers,
 * the validated lesson, and the player's progress are kept locally so a student
 * can close the tab and resume. (A future phase can sync this to the DB for
 * cross-device spaced return.) Everything here is SSR-safe — no-ops on the server.
 */
import type { KLesson } from "@/lib/keystone/schema";
import type { KeystoneAnswers } from "@/lib/keystone/questionnaire";

const ANSWERS_KEY = "keystone.answers.v1";
const LESSON_KEY = "keystone.lesson.v1";
const PROGRESS_KEY = "keystone.progress.v1";

/** Per-concept and per-section completion + calibration log, keyed by lesson title. */
export interface KProgress {
  lessonTitle: string;
  doneConceptIds: string[];
  prereqsDone: boolean;
  interleaveDone: boolean;
  synthesisDone: boolean;
  /** predicted (1–5) vs self-scored outcome (0 missed / 1 partial / 2 got it). */
  calibration: { conceptId: string; predicted: number; outcome: number }[];
  updatedAt: number;
}

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — non-fatal, the session just won't persist */
  }
}
function remove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const loadAnswers = (): KeystoneAnswers | null => read<KeystoneAnswers>(ANSWERS_KEY);
export const saveAnswers = (a: KeystoneAnswers): void => write(ANSWERS_KEY, a);

export const loadLesson = (): KLesson | null => read<KLesson>(LESSON_KEY);
export const saveLesson = (l: KLesson): void => write(LESSON_KEY, l);

export const loadProgress = (): KProgress | null => read<KProgress>(PROGRESS_KEY);
export function saveProgress(p: KProgress): void {
  write(PROGRESS_KEY, { ...p, updatedAt: Date.now() });
}

export function emptyProgress(lessonTitle: string): KProgress {
  return {
    lessonTitle,
    doneConceptIds: [],
    prereqsDone: false,
    interleaveDone: false,
    synthesisDone: false,
    calibration: [],
    updatedAt: Date.now(),
  };
}

/** Wipe a finished/abandoned run so the student can start fresh. */
export function clearLesson(): void {
  remove(LESSON_KEY);
  remove(PROGRESS_KEY);
}
export function clearAll(): void {
  remove(ANSWERS_KEY);
  clearLesson();
}

/* --------------------------- Revision Mode state -------------------------- */

const REVISION_KEY = "keystone.revision.v1";

/** Per-question mastery (0 missed / 1 partial / 2 got it) so weak items stay
 *  prioritized across refreshes, keyed by bank title. */
export interface KRevisionState {
  bankTitle: string;
  mastery: Record<string, number>;
  calibration: { predicted: number; outcome: number }[];
  updatedAt: number;
}

export function loadRevisionState(bankTitle: string): KRevisionState | null {
  const st = read<KRevisionState>(REVISION_KEY);
  return st && st.bankTitle === bankTitle ? st : null;
}
export function saveRevisionState(st: KRevisionState): void {
  write(REVISION_KEY, { ...st, updatedAt: Date.now() });
}
export function clearRevisionState(): void {
  remove(REVISION_KEY);
}
