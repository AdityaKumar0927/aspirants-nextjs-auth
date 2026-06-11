"use client";

import React, { useMemo } from "react";
import katex from "katex";
import "katex/dist/contrib/mhchem";
import { escapeHtml, sanitizeMathHtml } from "@/lib/sanitize";

interface MathRendererProps {
  text: string;
}

/**
 * KaTeX-based renderer for question text that may contain math.
 *
 * Security: non-math text is HTML-ESCAPED before assembly, only the matched
 * math spans are replaced with KaTeX output, KaTeX `trust` is DISABLED (so
 * \href{javascript:...}/\includegraphics etc. cannot inject), and the final
 * string is run through DOMPurify. Previously this rendered arbitrary text
 * straight into dangerouslySetInnerHTML with trust:true — a stored-XSS sink,
 * since question/option text is attacker-influenceable.
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
 * Splits text on math delimiters, escaping the prose and KaTeX-rendering the
 * math, so raw HTML in the prose can never reach the DOM unescaped.
 */
function renderMixed(input: string): string {
  const source = input.replace(/\r?\n|\r/g, " ");

  // Ordered so display delimiters are matched before their inline cousins.
  const pattern =
    /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^$]+?\$|\\\([\s\S]+?\\\))/g;

  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    result += escapeHtml(source.slice(lastIndex, match.index));
    const token = match[0];
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
  result += escapeHtml(source.slice(lastIndex));
  return result;
}

export default function MathRenderer({ text }: MathRendererProps) {
  const html = useMemo(() => {
    if (!text) return "";

    const hasDelimiters = /\$\$|\\\[|\$|\\\(/.test(text);
    const hasLatexCommands = /\\[a-zA-Z]+/.test(text);

    // No delimiters but bare LaTeX commands => treat the whole string as math.
    const raw =
      !hasDelimiters && hasLatexCommands
        ? renderMath(text.replace(/\r?\n|\r/g, " "), false)
        : renderMixed(text);

    return sanitizeMathHtml(raw);
  }, [text]);

  if (!text) return null;
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
