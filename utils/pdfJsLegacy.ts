type PdfJsLegacyModule = typeof import('pdfjs-dist/legacy/build/pdf.min.js')

let pdfjsLib: PdfJsLegacyModule | null = null

/**
 * PDF.js 3 legacy sin Web Worker (disableWorker).
 * Compatible con iOS 16 / Safari < 17.4 y evita errores de worker en Vite ("fake worker / unexpected token {").
 */
export async function getPdfJsLegacy(): Promise<PdfJsLegacyModule> {
  if (pdfjsLib) return pdfjsLib
  pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.min.js')
  return pdfjsLib
}

export function loadPdfDocument(pdfjs: PdfJsLegacyModule, data: ArrayBuffer) {
  return pdfjs.getDocument({
    data,
    disableWorker: true,
    isEvalSupported: false,
  })
}
