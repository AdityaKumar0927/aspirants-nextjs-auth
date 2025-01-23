"use client";

import React from "react";
import "katex/dist/katex.min.css";
import katex from "katex";

/**
 * MathRenderer handles multiple LaTeX delimiters:
 * - $$...$$ or \[...\]  => display-mode
 * - $...$ or \(...\)    => inline-mode
 * Also replaces literal "\n" with <br/>
 */
interface MathRendererProps {
  text: string;
}

const MathRenderer: React.FC<MathRendererProps> = ({ text }) => {
  if (!text) return null;

  let rendered = text;

  // 1) Display math: $$...$$
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

  // 5) Replace literal "\n" with <br/>
  rendered = rendered.replace(/\\n/g, "<br/>");

  return <span dangerouslySetInnerHTML={{ __html: rendered }} />;
};

export default MathRenderer;
