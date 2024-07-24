declare module 'pdfjs-dist' {
  import { PDFDocumentProxy, PDFWorker } from 'pdfjs-dist/types/src/display/api';

  export const GlobalWorkerOptions: {
    workerSrc: string;
  };

  export function getDocument(
    src: string | Uint8Array | DocumentInitParameters
  ): PDFDocumentLoadingTask;

  export interface DocumentInitParameters {
    url?: string;
    data?: Uint8Array;
  }

  export interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocumentProxy>;
  }
}
