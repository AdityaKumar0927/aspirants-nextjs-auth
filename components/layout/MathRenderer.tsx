"use client";

import React from "react";
import katex from "katex";
// Removed these lines:
// import 'katex/dist/contrib/amscd.css'
// import 'katex/dist/contrib/amscd'

// Keep mhchem if you still need it:
import "katex/dist/contrib/mhchem";

interface MathRendererProps {
  text: string;
}

/**
 * A "maximal" KaTeX-based MathRenderer that:
 *
 *  1) Removes newlines (so sub/superscripts don't break).
 *  2) Replaces $$...$$ and \[...\] (display math).
 *  3) Replaces $...$ and \(...\) (inline math).
 *  4) If no delimiters found but the text has \LaTeX commands, tries to parse entire string.
 *  5) Uses strict: false, trust: true => maximum KaTeX leniency.
 *  6) Optionally includes mhchem for advanced chemistry syntax if you import it above.
 */
export default function MathRenderer({ text }: MathRendererProps) {
  if (!text) return null;

  // 1) Replace raw newlines with a space
  let rendered = text.replace(/\r?\n|\r/g, " ");

  // KaTeX config: be lenient
  const options: katex.KatexOptions = {
    throwOnError: false,
    trust: true,
    strict: false,
    displayMode: false, // toggled to true for display blocks below
  };

  // -------------------------------
  // 2a) DISPLAY MATH: $$...$$
  // -------------------------------
  rendered = rendered.replace(/\$\$([\s\S]+?)\$\$/g, (_, mathExpr) => {
    try {
      return `<div class="katex-block">${katex.renderToString(mathExpr, {
        ...options,
        displayMode: true,
      })}</div>`;
    } catch {
      // Return original text if there's a parse error
      return `<div class="katex-block">${mathExpr}</div>`;
    }
  });

  // -------------------------------
  // 2b) DISPLAY MATH: \[...\]
  // -------------------------------
  rendered = rendered.replace(/\\\[([\s\S]+?)\\\]/g, (_, mathExpr) => {
    try {
      return `<div class="katex-block">${katex.renderToString(mathExpr, {
        ...options,
        displayMode: true,
      })}</div>`;
    } catch {
      return `<div class="katex-block">${mathExpr}</div>`;
    }
  });

  // -------------------------------
  // 3a) INLINE MATH: $...$
  // -------------------------------
  rendered = rendered.replace(/\$([\s\S]+?)\$/g, (_, mathExpr) => {
    try {
      return katex.renderToString(mathExpr, { ...options, displayMode: false });
    } catch {
      return mathExpr;
    }
  });

  // -------------------------------
  // 3b) INLINE MATH: \(...\)
  // -------------------------------
  rendered = rendered.replace(/\\\(([\s\S]+?)\\\)/g, (_, mathExpr) => {
    try {
      return katex.renderToString(mathExpr, { ...options, displayMode: false });
    } catch {
      return mathExpr;
    }
  });

  // -------------------------------
  // 4) If no delimiters but has \commands => parse entire
  // -------------------------------
  const hadDelimiters = /\$\$|\\\[|\$|\\\(/.test(text);
  const hasLatexCommands = /\\[a-zA-Z]+/.test(text); // e.g. \frac, \sqrt, \lim, etc.

  if (!hadDelimiters && hasLatexCommands) {
    try {
      rendered = katex.renderToString(rendered, { ...options, displayMode: false });
    } catch (err) {
      console.warn("MathRenderer fallback parse error:", err);
      // If parse fails, leave 'rendered' as-is
    }
  }

  return <span dangerouslySetInnerHTML={{ __html: rendered }} />;
}
