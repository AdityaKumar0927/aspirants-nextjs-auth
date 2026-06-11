import DOMPurify from "isomorphic-dompurify";

/**
 * HTML sanitization for user-generated rich text (solutions, replies, notes).
 *
 * isomorphic-dompurify runs in both Node (API routes) and the browser, so the
 * SAME allowlist is enforced on write (before persisting) and on render (before
 * dangerouslySetInnerHTML) — defense in depth against stored XSS.
 *
 * Allows the formatting the TipTap/rich editors produce; strips scripts,
 * event handlers, iframes, and javascript:/data: URLs.
 */
const RICH_TEXT_CONFIG = {
  ALLOWED_TAGS: [
    "p", "br", "span", "strong", "b", "em", "i", "u", "s", "del", "mark",
    "ul", "ol", "li", "blockquote", "code", "pre",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "a", "img",
    "table", "thead", "tbody", "tr", "th", "td",
    "sub", "sup", "hr",
  ],
  ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "class", "colspan", "rowspan"],
  // Block javascript:, data: (except images), vbscript: etc. on URL attributes.
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  ADD_ATTR: ["target"],
  FORBID_TAGS: ["style", "script", "iframe", "object", "embed", "form"],
  FORBID_ATTR: ["style", "onerror", "onload", "onclick"],
};

export function sanitizeRichText(dirty: string | null | undefined): string {
  if (!dirty) return "";
  const clean = DOMPurify.sanitize(dirty, RICH_TEXT_CONFIG) as unknown as string;
  return clean;
}

/**
 * Sanitizes an already-rendered HTML string (e.g. KaTeX output spliced with
 * escaped text). Permits the inline SVG/MathML KaTeX emits while still
 * stripping scripts and event handlers.
 */
const MATH_HTML_CONFIG = {
  USE_PROFILES: { html: true, svg: true, mathMl: true },
  ADD_TAGS: ["semantics", "annotation", "annotation-xml", "mrow", "mi", "mo", "mn", "msup", "msub"],
  FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "style"],
  FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
};

export function sanitizeMathHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, MATH_HTML_CONFIG) as unknown as string;
}

/** Escapes plain text so it is safe to embed inside an HTML string. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
