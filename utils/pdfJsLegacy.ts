import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.js?url'
import { ensurePromiseWithResolversPolyfill } from '~/utils/promiseWithResolversPolyfill'

type PdfJsLegacyModule = typeof import('pdfjs-dist/legacy/build/pdf.min.js')

let pdfjsLib: PdfJsLegacyModule | null = null

/**
 * workerSrc vía ?url (pre-bundle Vite) + pdfjsWorker en global para fake worker.
 * @see https://github.com/mozilla/pdf.js/issues/10478
 */
function applyWorkerSrc(mod: PdfJsLegacyModule): void {
  const lib = (mod as { default?: { GlobalWorkerOptions?: { workerSrc: string } } }).default ?? mod
  const gwo = lib.GlobalWorkerOptions
  if (!gwo) {
    throw new Error('PDF.js: GlobalWorkerOptions no disponible')
  }
  gwo.workerSrc = pdfWorkerUrl
}

export async function getPdfJsLegacy(): Promise<PdfJsLegacyModule> {
  if (pdfjsLib) return pdfjsLib

  ensurePromiseWithResolversPolyfill()
  await import('pdfjs-dist/legacy/build/pdf.worker.min.js')

  const mod = await import('pdfjs-dist/legacy/build/pdf.min.js')
  applyWorkerSrc(mod)

  pdfjsLib = mod
  return pdfjsLib
}

export function loadPdfDocument(pdfjs: PdfJsLegacyModule, data: ArrayBuffer) {
  return pdfjs.getDocument({
    data,
    isEvalSupported: false,
  })
}
