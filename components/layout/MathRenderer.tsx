"use client"

import React from "react"
import "katex/dist/katex.min.css"
import katex from "katex"

interface MathRendererProps {
  text: string
}

/**
 * A KaTeX-based MathRenderer that:
 * 1) Replaces display math: $$...$$, \[...\]
 * 2) Replaces inline math: $...$, \(...\)
 * 3) Removes newlines inside math text (so subscripts/superscripts don't split)
 * 4) If no known delimiters, tries to parse entire string as inline LaTeX
 */
export default function MathRenderer({ text }: MathRendererProps) {
  if (!text) return null

  // Remove all raw \n (and \r\n) so sub/superscripts don’t get broken up
  // Convert them to a single space.
  let rendered = text.replace(/\r?\n|\r/g, " ")

  // ----------------------------------------------------------------
  // 1) Display math: $$ ... $$
  //    We'll replace them with <div class="katex-block"> KaTeX HTML
  // ----------------------------------------------------------------
  rendered = rendered.replace(/\$\$([\s\S]+?)\$\$/g, (match, p1) => {
    const html = katex.renderToString(p1, {
      throwOnError: false,
      displayMode: true,
    })
    return `<div class="katex-block">${html}</div>`
  })

  // ----------------------------------------------------------------
  // 2) Display math: \[ ... \]
  // ----------------------------------------------------------------
  rendered = rendered.replace(/\\\[([\s\S]+?)\\\]/g, (match, p1) => {
    const html = katex.renderToString(p1, {
      throwOnError: false,
      displayMode: true,
    })
    return `<div class="katex-block">${html}</div>`
  })

  // ----------------------------------------------------------------
  // 3) Inline math: $ ... $
  // ----------------------------------------------------------------
  rendered = rendered.replace(/\$([\s\S]+?)\$/g, (match, p1) => {
    return katex.renderToString(p1, {
      throwOnError: false,
      displayMode: false,
    })
  })

  // ----------------------------------------------------------------
  // 4) Inline math: \(...\)
  // ----------------------------------------------------------------
  rendered = rendered.replace(/\\\(([\s\S]+?)\\\)/g, (match, p1) => {
    return katex.renderToString(p1, {
      throwOnError: false,
      displayMode: false,
    })
  })

  // ----------------------------------------------------------------
  // 5) If no delimiters found, but the text has backslash-latex commands,
  //    attempt to parse entire string as inline LaTeX
  // ----------------------------------------------------------------
  const hadAnyDelimiters = /\$\$|\\\[|\$|\\\(/.test(text)
  const hasLatexCommands = /\\[a-zA-Z]+/.test(text) // e.g. \frac, \int, etc.

  if (!hadAnyDelimiters && hasLatexCommands) {
    try {
      const entire = katex.renderToString(rendered, {
        throwOnError: false,
        displayMode: false,
      })
      rendered = entire
    } catch (err) {
      console.warn("MathRenderer: fallback parse failed", err)
    }
  }

  return <span dangerouslySetInnerHTML={{ __html: rendered }} />
}
