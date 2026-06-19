type PdfJsLegacyModule = typeof import('pdfjs-dist/legacy/build/pdf.min.js')

let pdfjsLib: PdfJsLegacyModule | null = null

function resolvePdfWorkerSrc(): string {
  if (typeof window !== 'undefined') {
    return new URL('/pdf.worker.legacy.min.js', window.location.origin).href
  }
  return '/pdf.worker.legacy.min.js'
}

/**
 * PDF.js 3 legacy para iOS 16+:
 * - worker estático en /public (Safari no infiere workerSrc con imports dinámicos)
 * - import del worker como módulo para fake worker en hilo principal
 */
export async function getPdfJsLegacy(): Promise<PdfJsLegacyModule> {
  if (pdfjsLib) return pdfjsLib

  await import('pdfjs-dist/legacy/build/pdf.worker.min.js')

  const mod = await import('pdfjs-dist/legacy/build/pdf.min.js')
  const lib = (mod as { default?: { GlobalWorkerOptions?: { workerSrc: string } } }).default ?? mod

  if (lib.GlobalWorkerOptions) {
    lib.GlobalWorkerOptions.workerSrc = resolvePdfWorkerSrc()
  }

  pdfjsLib = mod
  return pdfjsLib
}

export function loadPdfDocument(pdfjs: PdfJsLegacyModule, data: ArrayBuffer) {
  return pdfjs.getDocument({
    data,
    isEvalSupported: false,
  })
}
