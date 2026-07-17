import { ensurePromiseWithResolversPolyfill } from '~/utils/promiseWithResolversPolyfill'

type PdfJsLegacyModule = typeof import('pdfjs-dist/legacy/build/pdf.min.js')

let pdfjsLib: PdfJsLegacyModule | null = null
let initPromise: Promise<PdfJsLegacyModule> | null = null

/** Una sola copia en public/ (postinstall copy-pdf-worker). Evita chunks _nuxt/ duplicados. */
const PUBLIC_WORKER_PATH = '/pdf.worker.legacy.min.js'

/** iPad/iPhone (Safari y Chrome en iOS comparten WebKit). */
export function isAppleMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function resolvePdfLib(mod: PdfJsLegacyModule): PdfJsLegacyModule {
  return ((mod as { default?: PdfJsLegacyModule }).default ?? mod) as PdfJsLegacyModule
}

/**
 * workerSrc apunta al worker en public/ (una sola estrategia).
 * En iOS: priming del fake worker en hilo principal.
 * @see https://github.com/mozilla/pdf.js/issues/10478
 */
async function configureWorker(mod: PdfJsLegacyModule): Promise<void> {
  const lib = resolvePdfLib(mod)
  const gwo = (lib as { GlobalWorkerOptions?: { workerSrc: string } }).GlobalWorkerOptions
  if (!gwo) {
    throw new Error('PDF.js: GlobalWorkerOptions no disponible')
  }

  gwo.workerSrc = `${window.location.origin}${PUBLIC_WORKER_PATH}`

  if (isAppleMobile()) {
    // Priming: globalThis.pdfjsWorker para fake worker (estable en iPadOS 16)
    await import('pdfjs-dist/legacy/build/pdf.worker.min.js')
  }
}

/**
 * Inicializar PDF.js solo en cliente y tras mount (onMounted).
 * No importar pdfjs-dist en el top-level del componente.
 */
export function getPdfJsLegacy(): Promise<PdfJsLegacyModule> {
  if (import.meta.server) {
    return Promise.reject(new Error('PDF.js solo está disponible en el cliente'))
  }
  if (pdfjsLib) return Promise.resolve(pdfjsLib)
  if (initPromise) return initPromise

  initPromise = (async () => {
    ensurePromiseWithResolversPolyfill()
    const mod = await import('pdfjs-dist/legacy/build/pdf.min.js')
    await configureWorker(mod)
    pdfjsLib = mod
    return pdfjsLib
  })()

  return initPromise
}

export function loadPdfDocument(pdfjs: PdfJsLegacyModule, data: ArrayBuffer) {
  return pdfjs.getDocument({
    data,
    isEvalSupported: false,
  })
}
