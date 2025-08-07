export { formatCurrency } from './formatters'

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

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'CONFIRMADO':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'PENDIENTE':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'RECHAZADO':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export const getTotalPagosConfirmados = (pagos: any[]): number => {
  return pagos
    .filter(pago => pago.status === 'CONFIRMADO')
    .reduce((sum, pago) => sum + pago.monto, 0)
}

export const isPagoCompleto = (montoAPagar: number, totalPagado: number): boolean => {
  return totalPagado >= montoAPagar
}

export const getPorcentajePago = (montoAPagar: number, totalPagado: number): number => {
  if (montoAPagar === 0) return 0
  return Math.round((totalPagado / montoAPagar) * 100)
}

export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '-'
  
  // Remover espacios y caracteres especiales
  const cleaned = phone.replace(/\D/g, '')
  
  // Formatear según el patrón peruano
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  } else if (cleaned.length === 11 && cleaned.startsWith('51')) {
    return `+51 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`
  }
  
  return phone
}

export const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return dateString
    }
    
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
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