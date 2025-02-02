"use client"

import React from "react"
import katex from "katex"
import 'katex/dist/contrib/amscd.css'

// Optional if you need AMS/CD or mhchem expansions:
import 'katex/dist/contrib/amscd'
import "katex/contrib/mhchem"

interface MathRendererProps {
  text: string
}

/**
 * A "maximal" KaTeX-based MathRenderer that:
 *
 *  1) Removes newlines (so sub/superscripts don't break).
 *  2) Replaces $$...$$ and \[...\] (display math).
 *  3) Replaces $...$ and \(...\) (inline math).
 *  4) If no delimiters found but the text has \LaTeX commands, tries to parse entire string.
 *  5) Uses strict: false, trust: true => maximum KaTeX leniency.
 *  6) Optionally includes amscd/mhchem for advanced environments/chemistry if you import them above.
 *
 *  KaTeX still won't handle 100% of LaTeX packages, but this is as robust as possible
 *  within KaTeX's supported features.
 */
export default function MathRenderer({ text }: MathRendererProps) {
  if (!text) return null

  // 1) Replace raw newlines with a space
  let rendered = text.replace(/\r?\n|\r/g, " ")

  // KaTeX config: be lenient
  const options: katex.KatexOptions = {
    throwOnError: false,
    trust: true,       // allow certain HTML/commands
    strict: false,     // don't strictly complain about nonstandard LaTeX
    displayMode: false // we switch to true for display blocks
  }

  // -------------------------------
  // 2a) DISPLAY MATH: $$...$$
  // -------------------------------
  rendered = rendered.replace(/\$\$([\s\S]+?)\$\$/g, (_, mathExpr) => {
    try {
      return `<div class="katex-block">${
        katex.renderToString(mathExpr, {
          ...options,
          displayMode: true,
        })
      }</div>`
    } catch {
      // Return original text if there's a parse error
      return `<div class="katex-block">${mathExpr}</div>`
    }
  })

  // -------------------------------
  // 2b) DISPLAY MATH: \[...\]
  // -------------------------------
  rendered = rendered.replace(/\\\[([\s\S]+?)\\\]/g, (_, mathExpr) => {
    try {
      return `<div class="katex-block">${
        katex.renderToString(mathExpr, {
          ...options,
          displayMode: true,
        })
      }</div>`
    } catch {
      return `<div class="katex-block">${mathExpr}</div>`
    }
  })

  // -------------------------------
  // 3a) INLINE MATH: $...$
  // -------------------------------
  rendered = rendered.replace(/\$([\s\S]+?)\$/g, (_, mathExpr) => {
    try {
      return katex.renderToString(mathExpr, { ...options, displayMode: false })
    } catch {
      return mathExpr
    }
  })

  // -------------------------------
  // 3b) INLINE MATH: \(...\)
  // -------------------------------
  rendered = rendered.replace(/\\\(([\s\S]+?)\\\)/g, (_, mathExpr) => {
    try {
      return katex.renderToString(mathExpr, { ...options, displayMode: false })
    } catch {
      return mathExpr
    }
  })

  // -------------------------------
  // 4) If no delimiters but has \commands => parse entire
  // -------------------------------
  const hadDelimiters = /\$\$|\\\[|\$|\\\(/.test(text)
  const hasLatexCommands = /\\[a-zA-Z]+/.test(text) // e.g. \frac, \sqrt, \lim, etc.

  if (!hadDelimiters && hasLatexCommands) {
    try {
      rendered = katex.renderToString(rendered, { ...options, displayMode: false })
    } catch (err) {
      console.warn("MathRenderer fallback parse error:", err)
      // keep `rendered` as-is if parse fails
    }
  }

  return <span dangerouslySetInnerHTML={{ __html: rendered }} />
}
