"use client"

import { ReactNode } from "react";
import { useSpring, animated } from "@react-spring/web";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ReactMarkdown from "react-markdown";

interface CardProps {
  title: string;
  description: string;
  demo: ReactNode;
  large?: boolean;
  icon: any;
}

export default function Card({ title, description, demo, large, icon }: CardProps) {
  const [props, set] = useSpring(() => ({
    scale: 1,
    config: { tension: 300, friction: 10 },
  }));

  return (
    <animated.div
      className={`relative col-span-1 h-96 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md ${
        large ? "md:col-span-2" : ""
      }`}
      onMouseEnter={() => set({ scale: 1.05 })}
      onMouseLeave={() => set({ scale: 1 })}
      style={{ transform: props.scale.to((s) => `scale(${s})`) }}
    >
      <div className="flex h-60 items-center justify-center text-blue-500">
        <FontAwesomeIcon icon={icon} size="4x" />
      </div>
      <div className="mx-auto max-w-lg text-center">
        <h2 className="bg-gradient-to-br from-black to-blue-500 bg-clip-text font-display text-xl font-bold text-transparent md:text-3xl">
          {title}
        </h2>
        <div className="prose-sm mt-3 leading-normal text-gray-500 md:prose">
          <ReactMarkdown
            components={{
              a: ({ node, ...props }) => (
                <a
                  target="_blank"
                  {...props}
                  className="font-medium text-gray-800 underline transition-colors"
                />
              ),
              code: ({ node, ...props }) => (
                <code
                  {...props}
                  className="rounded-sm bg-gray-100 px-1 py-0.5 font-mono font-medium text-gray-800"
                />
              ),
            }}
          >
            {description}
          </ReactMarkdown>
        </div>
      </div>
    </animated.div>
  );
}
