// global.d.ts
interface MathJax {
  typesetPromise?: () => Promise<void>;
  typeset?: () => void;
}

interface Window {
  MathJax?: MathJax;
}
