/**
 * Plain-text sanitiser for admin-editable single-line strings (maintenance
 * message, announcement text, etc.). These are always rendered as TEXT (never
 * dangerouslySetInnerHTML), so this is defense-in-depth: drop C0/C1 control
 * characters and DEL, collapse runs of whitespace to single spaces, trim, and
 * hard-cap the length.
 *
 * Lives in its OWN module (NOT lib/sanitize) so importing it does not drag in
 * isomorphic-dompurify/jsdom — which fails to load in Vercel's serverless
 * function bundles. Implemented with a codepoint scan, no dependencies.
 */
export function cleanText(input: unknown, max: number): string {
  if (typeof input !== "string") return "";
  let out = "";
  for (const ch of input) {
    const code = ch.codePointAt(0) ?? 0;
    out += code < 32 || code === 127 ? " " : ch;
  }
  return out.replace(/\s+/g, " ").trim().slice(0, max);
}
