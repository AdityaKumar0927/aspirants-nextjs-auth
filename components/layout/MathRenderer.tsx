"use client";

import { useMemo } from "react";
import katex from "katex";
import "katex/contrib/mhchem";
import { escapeHtml, sanitizeMathHtml } from "@/lib/sanitize";

interface MathRendererProps {
  text: string;
}

/**
 * KaTeX-based renderer for question text that mixes rich HTML and math.
 *
 * Real exam content is HTML (`<p>`, `<img>` from a CDN, Match-the-column
 * `<table>`, `<sub>`/`<sup>`) interleaved with `$$...$$`/`\(...\)` LaTeX. So we
 * KEEP the prose HTML, KaTeX-render only the math spans, then run the whole
 * assembled string through DOMPurify (`sanitizeMathHtml`) — which is the real
 * security boundary: it strips `<script>`, event handlers, `javascript:` URLs,
 * iframes, forms and `<style>`. KaTeX `trust:false` blocks
 * \href{javascript:...}/\includegraphics injection. This is safe AND renders
 * the formatting; the earlier "escape everything" approach was XSS-safe but
 * broke every image, table and superscript in the bank.
 */
const KATEX_OPTIONS: katex.KatexOptions = {
  throwOnError: false,
  trust: false,
  strict: false,
};

function renderMath(expr: string, displayMode: boolean): string {
  try {
    return katex.renderToString(expr, { ...KATEX_OPTIONS, displayMode });
  } catch {
    return escapeHtml(expr);
  }
}

/**
 * Splits text on math delimiters, KaTeX-rendering the math and PRESERVING the
 * prose HTML between matches. The assembled string is DOMPurify-sanitized by the
 * caller, so the kept HTML is safe.
 */
function renderMixed(input: string): string {
  // Collapse newlines only inside math (KaTeX dislikes them); keep prose
  // newlines so block HTML structure survives. Done per-segment below.
  // Ordered so display delimiters are matched before their inline cousins.
  const pattern =
    /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^$]+?\$|\\\([\s\S]+?\\\))/g;

  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input)) !== null) {
    // Keep the prose exactly as authored (HTML included) — sanitised later.
    result += input.slice(lastIndex, match.index);
    const token = match[0].replace(/\r?\n|\r/g, " ");
    if (token.startsWith("$$")) {
      result += `<span class="katex-block">${renderMath(token.slice(2, -2), true)}</span>`;
    } else if (token.startsWith("\\[")) {
      result += `<span class="katex-block">${renderMath(token.slice(2, -2), true)}</span>`;
    } else if (token.startsWith("\\(")) {
      result += renderMath(token.slice(2, -2), false);
    } else {
      result += renderMath(token.slice(1, -1), false);
    }
    lastIndex = pattern.lastIndex;
  }
  result += input.slice(lastIndex);
  return result;
}

export default function MathRenderer({ text }: MathRendererProps) {
  const html = useMemo(() => {
    if (!text) return "";

    const hasDelimiters = /\$\$|\\\[|\$|\\\(/.test(text);
    const hasLatexCommands = /\\[a-zA-Z]+/.test(text);
    const hasHtml = /<[a-z!/][\s\S]*>/i.test(text);

    // Bare LaTeX with no delimiters AND no HTML => the whole string is one
    // formula (e.g. an option like "\frac{1}{2}"). Anything with HTML always
    // goes through the mixed path so its markup is preserved, not math-parsed.
    const raw =
      !hasDelimiters && hasLatexCommands && !hasHtml
        ? renderMath(text.replace(/\r?\n|\r/g, " "), false)
        : renderMixed(text);

    return sanitizeMathHtml(raw);
  }, [text]);

  if (!text) return null;
  return <span className="math-content" dangerouslySetInnerHTML={{ __html: html }} />;
}
