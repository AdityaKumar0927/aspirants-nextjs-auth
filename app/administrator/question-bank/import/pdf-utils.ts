/**
 * Client-side PDF engine for the import wizard.
 *
 * For each page we extract THREE things in the browser (no native server deps):
 *   1. a rendered page image (JPEG)         — visual truth for math & layout
 *   2. the real text layer in reading order  — authoritative prose source
 *   3. embedded figure rectangles            — computed from the PDF operator
 *      list (CTM tracking), NOT guessed by the LLM, then cropped from (1)
 *
 * The extraction model receives (1) + (2) and a list of figure descriptors,
 * and only has to ASSOCIATE figures with questions — never invent coordinates.
 */

export interface NormalizedBBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PageFigure {
  id: string; // stable within an import, e.g. "p3-f1"
  pageNumber: number;
  dataUrl: string; // PNG crop
  bbox: NormalizedBBox; // normalized to page (0..1)
  yCenter: number; // 0..1 vertical center, for ordering/association
}

export interface RenderedPage {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  imageDataUrl: string;
  text: string;
  hasTextLayer: boolean;
  figures: PageFigure[];
}

const TARGET_PAGE_WIDTH = 1500; // px — sharp enough for vision + legible math
const MAX_RENDER_SCALE = 3;

// Figure-noise filters (fractions of the page).
const MIN_FIG_W = 0.05;
const MIN_FIG_H = 0.04;
const MAX_FIG_AREA = 0.9; // exclude full-page scans / backgrounds
const MAX_FIGS_PER_PAGE = 8;

export async function renderAndExtract(
  file: File,
  options: {
    maxPages?: number;
    onProgress?: (done: number, total: number) => void;
  } = {}
): Promise<{ pages: RenderedPage[]; totalPagesInPdf: number }> {
  const { maxPages = 50, onProgress } = options;

  const pdfjs = await import("pdfjs-dist");
  // Worker served from public/pdf.worker.min.mjs (see import/README note).
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;

  try {
    const total = Math.min(doc.numPages, maxPages);
    const pages: RenderedPage[] = [];

    for (let pageNumber = 1; pageNumber <= total; pageNumber++) {
      const page = await doc.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(
        TARGET_PAGE_WIDTH / baseViewport.width,
        MAX_RENDER_SCALE
      );
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const canvasContext = canvas.getContext("2d");
      if (!canvasContext) throw new Error("Could not create canvas context");

      await page.render({ canvasContext, viewport }).promise;

      const [text, figures] = await Promise.all([
        reconstructText(page),
        extractFigures(page, viewport, canvas, pageNumber, pdfjs),
      ]);

      pages.push({
        pageNumber,
        canvas,
        imageDataUrl: canvas.toDataURL("image/jpeg", 0.85),
        text,
        hasTextLayer: text.trim().length > 20,
        figures,
      });
      onProgress?.(pageNumber, total);
    }

    return { pages, totalPagesInPdf: doc.numPages };
  } finally {
    await doc.destroy();
  }
}

// ---------------------------------------------------------------------------
// Text layer -> reading-order plain text
// ---------------------------------------------------------------------------

async function reconstructText(page: any): Promise<string> {
  let content;
  try {
    content = await page.getTextContent();
  } catch {
    return "";
  }
  type Item = { str: string; x: number; y: number; w: number };
  const items: Item[] = (content.items || [])
    .filter((it: any) => typeof it.str === "string")
    .map((it: any) => ({
      str: it.str,
      x: it.transform[4],
      y: it.transform[5],
      w: it.width ?? 0,
    }));
  if (items.length === 0) return "";

  // Group into lines by y (PDF y grows upward); 3pt tolerance.
  items.sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: Item[][] = [];
  let current: Item[] = [];
  let lineY = items[0].y;
  for (const it of items) {
    if (Math.abs(it.y - lineY) > 3) {
      if (current.length) lines.push(current);
      current = [];
      lineY = it.y;
    }
    current.push(it);
  }
  if (current.length) lines.push(current);

  return lines
    .map((line) => {
      line.sort((a, b) => a.x - b.x);
      let out = "";
      let prevEnd: number | null = null;
      for (const it of line) {
        // Insert a space when there's a visible horizontal gap.
        if (prevEnd !== null && it.x - prevEnd > 1 && !out.endsWith(" ")) {
          out += " ";
        }
        out += it.str;
        prevEnd = it.x + it.w;
      }
      return out.trimEnd();
    })
    .filter((l) => l.length > 0)
    .join("\n");
}

// ---------------------------------------------------------------------------
// Embedded figures -> rectangles via operator-list CTM tracking
// ---------------------------------------------------------------------------

async function extractFigures(
  page: any,
  viewport: any,
  canvas: HTMLCanvasElement,
  pageNumber: number,
  pdfjs: any
): Promise<PageFigure[]> {
  let opList;
  try {
    opList = await page.getOperatorList();
  } catch {
    return [];
  }
  const { OPS, Util } = pdfjs;
  const imageOps = new Set(
    [
      OPS.paintImageXObject,
      OPS.paintInlineImageXObject,
      OPS.paintImageMaskXObject,
      OPS.paintJpegXObject,
    ].filter((v) => v !== undefined)
  );

  let ctm = [1, 0, 0, 1, 0, 0];
  const stack: number[][] = [];
  const pxRects: NormalizedBBox[] = [];

  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i];
    if (fn === OPS.save) {
      stack.push(ctm.slice());
    } else if (fn === OPS.restore) {
      ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
    } else if (fn === OPS.transform) {
      ctm = Util.transform(ctm, opList.argsArray[i]);
    } else if (imageOps.has(fn)) {
      const rect = rectFromCtm(ctm, viewport, Util);
      if (rect) pxRects.push(rect);
    }
  }

  // Normalize, filter noise, merge overlaps, crop.
  const W = canvas.width;
  const H = canvas.height;
  const normalized = pxRects
    .map((r) => ({
      x: r.x / W,
      y: r.y / H,
      width: r.width / W,
      height: r.height / H,
    }))
    .filter(
      (r) =>
        r.width >= MIN_FIG_W &&
        r.height >= MIN_FIG_H &&
        r.width * r.height <= MAX_FIG_AREA &&
        r.x >= -0.02 &&
        r.y >= -0.02 &&
        r.x + r.width <= 1.02
    );

  const merged = mergeOverlapping(normalized)
    .sort((a, b) => a.y - b.y)
    .slice(0, MAX_FIGS_PER_PAGE);

  const figures: PageFigure[] = [];
  merged.forEach((bbox, idx) => {
    const dataUrl = cropFromCanvas(canvas, bbox);
    if (!dataUrl) return;
    figures.push({
      id: `p${pageNumber}-f${idx + 1}`,
      pageNumber,
      dataUrl,
      bbox,
      yCenter: bbox.y + bbox.height / 2,
    });
  });
  return figures;
}

/** Maps the unit square under `ctm` to a pixel-space bbox on the page canvas. */
function rectFromCtm(
  ctm: number[],
  viewport: any,
  Util: any
): NormalizedBBox | null {
  const corners = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ].map(([x, y]) => {
    const [ux, uy] = Util.applyTransform([x, y], ctm);
    const [vx, vy] = viewport.convertToViewportPoint(ux, uy);
    return [vx, vy];
  });
  const xs = corners.map((c) => c[0]);
  const ys = corners.map((c) => c[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const width = Math.max(...xs) - minX;
  const height = Math.max(...ys) - minY;
  if (!isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  return { x: minX, y: minY, width, height };
}

/** Unions overlapping/adjacent rectangles into single figure regions. */
function mergeOverlapping(rects: NormalizedBBox[], gap = 0.02): NormalizedBBox[] {
  const out: NormalizedBBox[] = [];
  for (const r of rects) {
    let merged = false;
    for (let i = 0; i < out.length; i++) {
      if (intersects(out[i], r, gap)) {
        out[i] = union(out[i], r);
        merged = true;
        break;
      }
    }
    if (!merged) out.push({ ...r });
  }
  return out;
}

function intersects(a: NormalizedBBox, b: NormalizedBBox, gap: number): boolean {
  return !(
    a.x > b.x + b.width + gap ||
    b.x > a.x + a.width + gap ||
    a.y > b.y + b.height + gap ||
    b.y > a.y + a.height + gap
  );
}

function union(a: NormalizedBBox, b: NormalizedBBox): NormalizedBBox {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  };
}

/**
 * Crops a normalized-bbox region out of a rendered page canvas.
 * Returns a PNG data URL, or null when the region is degenerate.
 */
export function cropFromCanvas(
  canvas: HTMLCanvasElement,
  bbox: NormalizedBBox,
  padding = 0.012
): string | null {
  const x0 = Math.max(0, bbox.x - padding) * canvas.width;
  const y0 = Math.max(0, bbox.y - padding) * canvas.height;
  const x1 = Math.min(1, bbox.x + bbox.width + padding) * canvas.width;
  const y1 = Math.min(1, bbox.y + bbox.height + padding) * canvas.height;

  const width = Math.floor(x1 - x0);
  const height = Math.floor(y1 - y0);
  if (width < 12 || height < 12) return null;

  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  const ctx = out.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(canvas, x0, y0, width, height, 0, 0, width, height);
  return out.toDataURL("image/png");
}

/**
 * Splits page numbers into overlapping batches for extraction
 * (overlap lets questions that span a page boundary be captured whole).
 * e.g. 7 pages, size 3 => [1,2,3], [3,4,5], [5,6,7]
 */
export function batchPages(pageCount: number, batchSize = 3): number[][] {
  if (pageCount <= 0) return [];
  if (pageCount <= batchSize) {
    return [Array.from({ length: pageCount }, (_, i) => i + 1)];
  }
  const step = batchSize - 1;
  const batches: number[][] = [];
  for (let start = 1; start <= pageCount - 1; start += step) {
    const end = Math.min(start + batchSize - 1, pageCount);
    batches.push(Array.from({ length: end - start + 1 }, (_, i) => start + i));
    if (end === pageCount) break;
  }
  return batches;
}

/**
 * Stable key to deduplicate questions found in overlapping batches.
 * Prefers the (reliable) question number from the text layer; falls back to a
 * normalized text prefix.
 */
export function questionDedupeKey(q: {
  questionNumber?: string | null;
  text: string;
}): string {
  const num = (q.questionNumber ?? "").trim();
  const normalized = q.text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .slice(0, 80);
  // A bare number is not unique across sections; always include text.
  return `${num}|${normalized}`;
}
