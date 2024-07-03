// global.d.ts
interface MathJax {
  typesetPromise?: () => Promise<void>;
  typeset?: () => void;
}

interface Window {
  MathJax?: MathJax;
}

declare namespace JSX {
  interface IntrinsicElements {
    'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
}
