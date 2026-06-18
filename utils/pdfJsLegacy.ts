import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import { ensurePromiseWithResolversPolyfill } from '~/utils/promiseWithResolversPolyfill'

type PdfJsLegacyModule = typeof import('pdfjs-dist/legacy/build/pdf.min.mjs')

let pdfjsLib: PdfJsLegacyModule | null = null

/**
 * PDF.js legacy (Safari < 17.4) con worker empaquetado por Vite (?url estático).
 * El import dinámico ?url devolvía JSON y provocaba "fake worker / unexpected token {".
 */
export async function getPdfJsLegacy(): Promise<PdfJsLegacyModule> {
  if (pdfjsLib) return pdfjsLib
  ensurePromiseWithResolversPolyfill()
  const mod = await import('pdfjs-dist/legacy/build/pdf.min.mjs')
  mod.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
  pdfjsLib = mod
  return pdfjsLib
}

export function loadPdfDocument(pdfjs: PdfJsLegacyModule, data: ArrayBuffer) {
  return pdfjs.getDocument({
    data,
    isEvalSupported: false,
  })
}
