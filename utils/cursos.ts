/** Re-exportaciones desde formatters y consolidado para evitar duplicados en el bundle */
export { formatCurrency, formatDate } from './formatters'
export {
  getEstadoColor,
  getStatusColor,
  getTotalPagosConfirmados,
  formatPhoneNumber,
} from './consolidado'

/** Texto en soles para planes landing / API pública (ej. 200 → "S/. 200"). */
export function formatPrecioPlanSoles(pen: number): string {
  const n = Math.floor(Number(pen))
  return Number.isFinite(n) && n >= 0 ? `S/. ${n}` : ''
}

/** Obtiene entero PEN desde texto guardado o solo dígitos (ej. "550", "S/. 550"). */
export function parseEnteroPenDesdeTexto(s: string | null | undefined): number | null {
  if (s == null || String(s).trim() === '') return null
  const digits = String(s).replace(/\s/g, '').match(/(\d+)/)
  if (!digits) return null
  const n = parseInt(digits[1], 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Versión para montos directos (cursos), distinta de consolidado que usa ConsolidadoItem */
export const isPagoCompleto = (montoAPagar: number, totalPagado: number): boolean => {
  return totalPagado >= montoAPagar
}

export const getPorcentajePago = (montoAPagar: number, totalPagado: number): number => {
  if (montoAPagar === 0) return 0
  return Math.round((totalPagado / montoAPagar) * 100)
}

export const generateFileName = (url: string): string => {
  if (!url) return 'Sin archivo'
  const urlParts = url.split('/')
  const fileName = urlParts[urlParts.length - 1]
  try {
    return decodeURIComponent(fileName)
  } catch {
    return fileName
  }
}
