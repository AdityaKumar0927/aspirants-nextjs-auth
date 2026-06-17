/**
 * Keystone — client-only persistence (localStorage).
 *
 * The whole MVP runs without a server or an account: the questionnaire answers,
 * the validated lesson, and the player's progress are kept locally so a student
 * can close the tab and resume. (A future phase can sync this to the DB for
 * cross-device spaced return.) Everything here is SSR-safe — no-ops on the server.
 */
import type { KLesson, KRevisionBank } from "@/lib/keystone/schema";
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

const REVISION_PREFIX = "keystone.revision.";

/** Per-question mastery (0 missed / 1 partial / 2 got it) + calibration, kept
 *  PER shelf item (keyed by item id) so two revision sets don't clobber each
 *  other. Calibration is keyed by question id (one row per question, latest
 *  attempt wins) so re-answers don't inflate the alignment stat. */
export interface KRevisionState {
  itemId: string;
  mastery: Record<string, number>;
  calibration: Record<string, { predicted: number; outcome: number }>;
  updatedAt: number;
}

export function loadRevisionState(itemId: string): KRevisionState | null {
  return read<KRevisionState>(REVISION_PREFIX + itemId);
}
export function saveRevisionState(st: KRevisionState): void {
  write(REVISION_PREFIX + st.itemId, { ...st, updatedAt: Date.now() });
}
export function clearRevisionState(itemId: string): void {
  remove(REVISION_PREFIX + itemId);
}

/* ------------------------------ The shelf -------------------------------- */
/* A library of saved lessons + revision sets, with an expanding spaced-return
 * schedule tracked across sessions (on-device). */

const LIBRARY_KEY = "keystone.library.v1";
const DAY = 24 * 60 * 60 * 1000;
/** Expanding review gaps: 1d, 3d, 1w, 2w, 1mo. Indexed by reviewCount. */
const GAPS = [DAY, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY];

export interface KLibraryItem {
  id: string;
  mode: "learning" | "revision";
  title: string;
  subject: string | null;
  createdAt: number;
  lastStudiedAt: number | null;
  /** When this item next becomes due for review (ms epoch); null = never studied. */
  dueAt: number | null;
  reviewCount: number;
  data: KLesson | KRevisionBank;
  progress: KProgress | null;
  /** Device clock of the last local change — drives last-writer-wins cloud merge. */
  updatedAt: number;
}

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "k" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function listLibrary(): KLibraryItem[] {
  const arr = read<KLibraryItem[]>(LIBRARY_KEY);
  return Array.isArray(arr) ? arr : [];
}
export function getLibraryItem(id: string): KLibraryItem | null {
  return listLibrary().find((x) => x.id === id) ?? null;
}
export function upsertLibraryItem(item: KLibraryItem): void {
  const list = listLibrary();
  const stamped = { ...item, updatedAt: Date.now() };
  const i = list.findIndex((x) => x.id === stamped.id);
  if (i >= 0) list[i] = stamped;
  else list.unshift(stamped);
  write(LIBRARY_KEY, list.slice(0, 50));
}
export function removeLibraryItem(id: string): void {
  write(LIBRARY_KEY, listLibrary().filter((x) => x.id !== id));
}
/**
 * Merge cloud items into the local shelf, LAST-WRITER-WINS by updatedAt (a single
 * deterministic write — keeps the 50 most-recent). Returns the ids whose local
 * copy is newer (or cloud-absent), so the caller can push exactly those up.
 */
export function mergeRemoteItems(remote: KLibraryItem[]): string[] {
  const local = listLibrary();
  const byId = new Map<string, KLibraryItem>(local.map((x) => [x.id, x]));
  const toPush: string[] = [];
  const remoteIds = new Set(remote.map((r) => r.id));
  for (const r of remote) {
    const l = byId.get(r.id);
    if (!l || (r.updatedAt ?? 0) >= (l.updatedAt ?? 0)) byId.set(r.id, r); // cloud newer/new → take
    else toPush.push(r.id); // local newer → keep local, push it
  }
  for (const l of local) if (!remoteIds.has(l.id)) toPush.push(l.id); // local-only → push
  const merged = Array.from(byId.values())
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
    .slice(0, 50);
  write(LIBRARY_KEY, merged);
  return toPush;
}
/** Record a study session: stamp lastStudied and push out the next due date. */
export function markStudied(id: string): void {
  const list = listLibrary();
  const it = list.find((x) => x.id === id);
  if (!it) return;
  const now = Date.now();
  it.lastStudiedAt = now;
  it.dueAt = now + GAPS[Math.min(it.reviewCount, GAPS.length - 1)];
  it.reviewCount += 1;
  it.updatedAt = now;
  write(LIBRARY_KEY, list);
}
/** True if the item is due for review now (or never studied). */
export function isDue(it: KLibraryItem): boolean {
  return it.dueAt === null || it.dueAt <= Date.now();
}
