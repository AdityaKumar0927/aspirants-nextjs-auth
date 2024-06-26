"use client";

import React, { useEffect, useRef } from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';

interface MathRendererProps {
  text: string;
}

const MathRenderer: React.FC<MathRendererProps> = ({ text }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      katex.render(text, ref.current, {
        throwOnError: false,
        displayMode: true,
      });
    }
  }, [text]);

  return <div ref={ref} />;
};

export default MathRenderer;
