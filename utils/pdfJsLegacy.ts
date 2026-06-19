type PdfJsLegacyModule = typeof import('pdfjs-dist/legacy/build/pdf.min.js')

let pdfjsLib: PdfJsLegacyModule | null = null

const PDFJS_VERSION = '3.11.174'

/**
 * Worker en CDN (misma versión que pdfjs-dist) + fallback local en /public.
 * @see https://github.com/mozilla/pdf.js/issues/10478
 */
function resolvePdfWorkerSrc(): string {
  const cdnWorker = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`
  if (typeof window !== 'undefined') {
    return new URL('/pdf.worker.legacy.min.js', window.location.origin).href
  }
  return cdnWorker
}

function applyWorkerSrc(mod: PdfJsLegacyModule): void {
  const workerSrc = resolvePdfWorkerSrc()
  const candidates = [
    (mod as { default?: { GlobalWorkerOptions?: { workerSrc: string } } }).default?.GlobalWorkerOptions,
    (mod as { GlobalWorkerOptions?: { workerSrc: string } }).GlobalWorkerOptions,
  ].filter(Boolean) as Array<{ workerSrc: string }>

  if (!candidates.length) {
    throw new Error('PDF.js: GlobalWorkerOptions no disponible')
  }

  for (const gwo of candidates) {
    gwo.workerSrc = workerSrc
  }

  if (!candidates[0].workerSrc) {
    throw new Error('No "GlobalWorkerOptions.workerSrc" specified.')
  }
}

export async function getPdfJsLegacy(): Promise<PdfJsLegacyModule> {
  if (pdfjsLib) return pdfjsLib

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
