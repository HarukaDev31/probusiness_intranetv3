/** Re-exportaciones desde formatters y consolidado para evitar duplicados en el bundle */
export { formatCurrency, formatDate } from './formatters'
export {
  getEstadoColor,
  getStatusColor,
  getTotalPagosConfirmados,
  formatPhoneNumber,
} from './consolidado'

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
