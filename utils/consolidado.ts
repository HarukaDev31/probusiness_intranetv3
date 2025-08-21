import type { ConsolidadoItem, PagoDetalle } from '../types/pagos/consolidado-pagos'

/**
 * Formatea un monto como moneda
 */
export const formatCurrency = (amount: number, type: string='USD'): string => {
  if (type === 'PEN') {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(amount)
  } else {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }
}

/**
 * Obtiene el color del badge según el estado de pago
 */
export const getEstadoColor = (estado: string): string => {
  switch (estado) {
    case 'PAGADO':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'PENDIENTE':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'ADELANTO':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'SOBREPAGO':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

/**
 * Obtiene el color del badge según el status del pago
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'CONFIRMADO':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'PENDIENTE':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'RECHAZADO':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'EN_PROCESO':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

/**
 * Calcula el total de pagos confirmados
 */
export const getTotalPagosConfirmados = (pagos: PagoDetalle[]): number => {
  return pagos
    .filter(pago => pago.status === 'CONFIRMADO')
    .reduce((sum, pago) => sum + pago.monto, 0)
}

/**
 * Verifica si todos los pagos están confirmados
 */
export const isPagoCompleto = (item: ConsolidadoItem): boolean => {
  const totalConfirmado = getTotalPagosConfirmados(item.pagos_detalle)
  return totalConfirmado >= item.monto_a_pagar
}

/**
 * Obtiene el porcentaje de pago completado
 */
export const getPorcentajePago = (item: ConsolidadoItem): number => {
  const totalConfirmado = getTotalPagosConfirmados(item.pagos_detalle)
  return Math.min((totalConfirmado / item.monto_a_pagar) * 100, 100)
}

/**
 * Formatea un número de teléfono
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return ''
  
  // Remover caracteres no numéricos
  const cleaned = phone.replace(/\D/g, '')
  
  // Formatear según el patrón peruano
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  } else if (cleaned.length === 10) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`
  }
  
  return phone
}

/**
 * Formatea un número de documento
 */
export const formatDocument = (document: string): string => {
  if (!document) return '-'
  
  // Si es DNI (8 dígitos)
  if (document.length === 8) {
    return `${document.slice(0, 2)}.${document.slice(2, 5)}.${document.slice(5)}`
  }
  
  // Si es RUC (11 dígitos)
  if (document.length === 11) {
    return `${document.slice(0, 2)}.${document.slice(2, 5)}.${document.slice(5, 8)}.${document.slice(8)}`
  }
  
  return document
} 