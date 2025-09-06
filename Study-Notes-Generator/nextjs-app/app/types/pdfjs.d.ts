// types/pdfjs.d.ts

declare module 'pdfjs-dist/legacy/build/pdf' {
  // ← drop “type” so TS emits this at runtime
  import * as PDFJS from 'pdfjs-dist';
  const pdfjsLib: typeof PDFJS;
  export default pdfjsLib;
}

declare module 'pdfjs-dist/build/pdf.worker.entry' {
  const workerSrc: string;
  export default workerSrc;
}
