"use client";

import React from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';

interface MathRendererProps {
  text: string;
}

const MathRenderer: React.FC<MathRendererProps> = ({ text }) => {
  const renderedText = text
    // Replace inline math
    .replace(/\\\((.*?)\\\)/g, (match: string, p1: string) => {
      return katex.renderToString(p1, {
        throwOnError: false,
      });
    })
    // Replace block math
    .replace(/\\\[(.*?)\\\]/g, (match: string, p1: string) => {
      return `<div class="katex-block">${katex.renderToString(p1, {
        throwOnError: false,
        displayMode: true,
      })}</div>`;
    })
    // Replace newline characters with <br />
    .replace(/\\n/g, '<br />');

  return <span dangerouslySetInnerHTML={{ __html: renderedText }} />;
};

export default MathRenderer;
