"use client";

import React, { useEffect } from "react";

export default function TallyForm() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://tally.so/widgets/embed.js";
    script.async = true;
    script.onload = () => {
      const iframes = document.querySelectorAll<HTMLIFrameElement>(
        'iframe[data-tally-src]:not([src])'
      );
      iframes.forEach((iframe) => {
        const src = iframe.getAttribute("data-tally-src");
        if (src) {
          iframe.setAttribute("src", src);
        }
      });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full">
      <iframe
        data-tally-src="https://tally.so/r/mZzar0?transparentBackground=1"
        width="100%"
        height="100%"
        title="We're building a free, JEE and CUET exam prep platform! Fill this form to help us out as well as get early access to our site"
        style={{
          border: "none",
          margin: 0,
          padding: 0,
          overflow: "hidden",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%"
        }}
      ></iframe>
    </div>
  );
}