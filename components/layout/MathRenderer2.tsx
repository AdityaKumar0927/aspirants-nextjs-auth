"use client";

import React, { useEffect, useState } from "react";
import "katex/dist/katex.min.css";
import katex from "katex";

interface MathRendererProps {
  text: string;
}

const MathRenderer: React.FC<MathRendererProps> = ({ text }) => {
  const [renderedHTML, setRenderedHTML] = useState<string>("");

  useEffect(() => {
    const html = text
      .replace(/\\\((.*?)\\\)/g, (_, math) => katex.renderToString(math, { throwOnError: false }))
      .replace(/\\\[(.*?)\\\]/g, (_, math) => `<div class="katex-block">${katex.renderToString(math, { throwOnError: false, displayMode: true })}</div>`)
      .replace(/\\n/g, "<br />");

    setRenderedHTML(html);
  }, [text]);

  return <span dangerouslySetInnerHTML={{ __html: renderedHTML }} />;
};

export default MathRenderer;
