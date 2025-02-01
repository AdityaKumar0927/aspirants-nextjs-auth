"use client";

import React from "react";
import "katex/dist/katex.min.css";
import katex from "katex";

interface MathRendererProps {
  text: string;
}

/**
 * A more flexible MathRenderer that:
 * 1) Replaces display math: $$...$$ and \[...\]
 * 2) Replaces inline math: $...$ and \(...\)
 * 3) Replaces \n with <br/>
 * 4) If we find no delimiters, attempts to parse the ENTIRE string as inline LaTeX
 */
export default function MathRenderer({ text }: MathRendererProps) {
  if (!text) return null;

  let rendered = text;

  // 1) Display math: $$...$$
  //    We replace them with a <div class="katex-block"> containing KaTeX HTML
  //    /([\s\S]+?)\$\$/ => use "greedy" but minimal inside
  rendered = rendered.replace(/\$\$([\s\S]+?)\$\$/g, (match, p1) => {
    const html = katex.renderToString(p1, {
      throwOnError: false,
      displayMode: true,
    });
    return `<div class="katex-block">${html}</div>`;
  });

  // 2) Display math: \[...\]
  rendered = rendered.replace(/\\\[([\s\S]+?)\\\]/g, (match, p1) => {
    const html = katex.renderToString(p1, {
      throwOnError: false,
      displayMode: true,
    });
    return `<div class="katex-block">${html}</div>`;
  });

  // 3) Inline math: $...$
  rendered = rendered.replace(/\$([\s\S]+?)\$/g, (match, p1) => {
    return katex.renderToString(p1, {
      throwOnError: false,
      displayMode: false,
    });
  });

  // 4) Inline math: \(...\)
  rendered = rendered.replace(/\\\(([\s\S]+?)\\\)/g, (match, p1) => {
    return katex.renderToString(p1, {
      throwOnError: false,
      displayMode: false,
    });
  });

  // 5) Convert \n => <br/>
  rendered = rendered.replace(/\\n/g, "<br/>");

  // 6) If we STILL have not replaced any standard delimiters, but the user might
  //    have typed raw LaTeX (e.g. "\int_\limits{1/4}^{3/4} ..."), attempt to parse
  //    the entire string as inline LaTeX. We'll check if we had ANY of the known
  //    delimiters before. If not, do a final parse.

  // We'll do a quick check: if the original text did not contain ANY of the delimiters
  // ($$, \[...\], $...$, \(...\)) but DOES appear to have backslash-latex commands
  // (like "\frac", "\int", etc.), let's do a final parse of the entire text:
  const hasDelimiters = /\$\$|\\\[|\$|\\\(/.test(text);
  const hasBackslashCommands = /\\[a-zA-Z]+/.test(text); // e.g. \frac, \int, \sqrt, etc.

  if (!hasDelimiters && hasBackslashCommands) {
    // We'll attempt to parse entire text
    // (but only if we haven't replaced anything with math)
    try {
      const entireHTML = katex.renderToString(text, {
        throwOnError: false,
        displayMode: false,
      });
      rendered = entireHTML; // Overwrite the rendered text with the entire parse
    } catch (err) {
      // If there's an error, we'll just keep the original `rendered` text
      console.warn("MathRenderer: fallback parse failed", err);
    }
  }

  return <span dangerouslySetInnerHTML={{ __html: rendered }} />;
}
