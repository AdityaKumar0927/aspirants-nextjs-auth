"use client"

import React from "react"
import "katex/dist/katex.min.css"
import katex from "katex"

interface MathRendererProps {
  text: string
}

export default function MathRenderer({ text }: MathRendererProps) {
  if (!text) return null

  let rendered = text

  // $$...$$ (display)
  rendered = rendered.replace(/\$\$([\s\S]+?)\$\$/g, (match, p1) => {
    const html = katex.renderToString(p1, {
      throwOnError: false,
      displayMode: true,
    })
    return `<div class="katex-block">${html}</div>`
  })

  // \[...\] (display)
  rendered = rendered.replace(/\\\[([\s\S]+?)\\\]/g, (match, p1) => {
    const html = katex.renderToString(p1, {
      throwOnError: false,
      displayMode: true,
    })
    return `<div class="katex-block">${html}</div>`
  })

  // $...$ (inline)
  rendered = rendered.replace(/\$([\s\S]+?)\$/g, (match, p1) => {
    return katex.renderToString(p1, {
      throwOnError: false,
      displayMode: false,
    })
  })

  // \(...\) (inline)
  rendered = rendered.replace(/\\\(([\s\S]+?)\\\)/g, (match, p1) => {
    return katex.renderToString(p1, {
      throwOnError: false,
      displayMode: false,
    })
  })

  // \n => <br/>
  rendered = rendered.replace(/\\n/g, "<br/>")

  return <span dangerouslySetInnerHTML={{ __html: rendered }} />
}
