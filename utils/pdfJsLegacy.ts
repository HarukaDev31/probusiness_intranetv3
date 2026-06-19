import { ensurePromiseWithResolversPolyfill } from '~/utils/promiseWithResolversPolyfill'

type PdfJsLegacyModule = typeof import('pdfjs-dist/legacy/build/pdf.min.js')

let pdfjsLib: PdfJsLegacyModule | null = null
let workerConfigured = false

const PUBLIC_WORKER_PATH = '/pdf.worker.legacy.min.js'

/** iPad/iPhone Safari (incl. iOS con user agent de escritorio). */
export function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isIOS =
    /iPad|iPhone|iPod/.test(ua)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|Chrome|Chromium|Android/i.test(ua)
  return isIOS && isSafari
}

function resolvePdfLib(mod: PdfJsLegacyModule): PdfJsLegacyModule {
  return ((mod as { default?: PdfJsLegacyModule }).default ?? mod) as PdfJsLegacyModule
}

/**
 * Configura workerSrc solo en cliente, tras el mount.
 * En iOS Safari usa el worker copiado a /public (misma origen) para evitar el fake worker.
 */
async function configureWorker(mod: PdfJsLegacyModule): Promise<void> {
  if (workerConfigured) return

  const lib = resolvePdfLib(mod)
  const gwo = (lib as { GlobalWorkerOptions?: { workerSrc: string } }).GlobalWorkerOptions
  if (!gwo) {
    throw new Error('PDF.js: GlobalWorkerOptions no disponible')
  }

  if (isIosSafari()) {
    gwo.workerSrc = `${window.location.origin}${PUBLIC_WORKER_PATH}`
  } else {
    const workerMod = await import('pdfjs-dist/legacy/build/pdf.worker.min.js?url')
    gwo.workerSrc = workerMod.default
  }

  workerConfigured = true
}

/**
 * Carga pdfjs-dist legacy solo en cliente (nunca en SSR).
 */
export async function getPdfJsLegacy(): Promise<PdfJsLegacyModule> {
  if (import.meta.server) {
    throw new Error('PDF.js solo está disponible en el cliente')
  }

  if (pdfjsLib) return pdfjsLib

  ensurePromiseWithResolversPolyfill()

  const mod = await import('pdfjs-dist/legacy/build/pdf.min.js')
  await configureWorker(mod)

  pdfjsLib = mod
  return pdfjsLib
}

export function loadPdfDocument(pdfjs: PdfJsLegacyModule, data: ArrayBuffer) {
  const lib = resolvePdfLib(pdfjs)

  // Safari iOS: el worker asíncrono suele fallar → render en hilo principal.
  const disableWorker = isIosSafari()

  return lib.getDocument({
    data,
    isEvalSupported: false,
    disableWorker,
  })
}
