"use client"

import React from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface MathRendererProps {
  text: string
}

export default function MathRenderer({ text }: MathRendererProps) {
  const renderMathContent = React.useMemo(() => {
    if (!text) return []

    const segments = text.split(/(\$\$.*?\$\$|\$.*?\$)/gs)
    
    return segments.map((segment, index) => {
      if (segment.startsWith('$$') && segment.endsWith('$$')) {
        // Block math
        const math = segment.slice(2, -2)
        try {
          const html = katex.renderToString(math, { throwOnError: false, displayMode: true })
          return <div key={index} dangerouslySetInnerHTML={{ __html: html }} />
        } catch (error) {
          console.error('KaTeX block math error:', error)
          return <div key={index}>{segment}</div>
        }
      } else if (segment.startsWith('$') && segment.endsWith('$')) {
        // Inline math
        const math = segment.slice(1, -1)
        try {
          const html = katex.renderToString(math, { throwOnError: false, displayMode: false })
          return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />
        } catch (error) {
          console.error('KaTeX inline math error:', error)
          return <span key={index}>{segment}</span>
        }
      } else {
        // Regular text
        return <React.Fragment key={index}>{segment}</React.Fragment>
      }
    })
  }, [text])

  return <div className="math-renderer">{renderMathContent}</div>
}