// components/layout/MathRenderer.tsx
"use client";

import React from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';

interface MathRendererProps {
  text: string;
}

const MathRenderer: React.FC<MathRendererProps> = ({ text }) => {
  const renderedText = text.replace(/\\\((.*?)\\\)/g, (match: string, p1: string) => {
    return katex.renderToString(p1, {
      throwOnError: false,
    });
  });

  return <span dangerouslySetInnerHTML={{ __html: renderedText }} />;
};

export default MathRenderer;
