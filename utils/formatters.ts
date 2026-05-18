/**
 * Utilidades para formateo de datos reutilizables en toda la aplicación
 */

/** Zona horaria de negocio (servidor en AWS; usuarios en Perú). */
export const TIMEZONE_PERU = 'America/Lima'

const MESES_CORTOS_ES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic'
] as const

/**
 * Parsea una fecha ignorando zona horaria (evita desplazamiento de día)
 */
const parseDateNoTZ = (input: string | Date | number): Date => {
  if (input instanceof Date) return input
  if (typeof input === 'number') return new Date(input)

  const s = String(input).trim()
  const base = s.includes('T') ? s.split('T')[0] : s

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(base)
  if (iso) {
    const [, y, m, d] = iso
    return new Date(Number(y), Number(m) - 1, Number(d))
  }

  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(base)
  if (dmy) {
    const [, d, m, y] = dmy
    return new Date(Number(y), Number(m) - 1, Number(d))
  }

  return new Date(s)
}

function parseInstante(val: string | Date | number): Date | null {
  if (val instanceof Date) return val
  if (typeof val === 'number') return new Date(val)
  const s = String(val).trim()
  if (!s) return null
  const d = /\d{4}-\d{2}-\d{2}T\d/.test(s) || /Z$/i.test(s) || /[+-]\d{2}:\d{2}$/.test(s)
    ? new Date(s)
    : parseDateNoTZ(s)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Marca de tiempo de chat Soporte TI: «18 may 13:31» en hora Perú.
 */
export function formatSoporteTiMarcaTiempo(val: string | Date | null | undefined): string {
  const d = val == null ? null : parseInstante(val)
  if (!d) return typeof val === 'string' ? val : ''

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE_PERU,
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(d)

  const map: Record<string, string> = {}
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value
  }

  const mesIdx = Math.max(0, Math.min(11, Number(map.month) - 1))
  const hora = (map.hour ?? '00').padStart(2, '0')
  const min = (map.minute ?? '00').padStart(2, '0')

  return `${map.day} ${MESES_CORTOS_ES[mesIdx]} ${hora}:${min}`
}

/**
 * Formatea un número como moneda
 * @param amount - Cantidad a formatear
 * @param type - Tipo de moneda (por defecto 'USD')
 * @returns String formateado como moneda
 */
export const formatCurrency = (amount: number, type: string = 'USD'): string => {
  if (amount === null || amount === undefined) return '$0.00'
  
  if (type === 'PEN') {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  } else {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }
}
export const getDateParts = (date: string): { year: number, month: number, day: number } => {
  //from 2025-06-09T00:00:00.000000Z to 2025-06-09
  const [year, month, day] = date.split('T')[0].split('-')
  return { year: parseInt(year), month: parseInt(month), day: parseInt(day) }
}
/**
 * Formatea un número con separadores de miles
 * @param number - Número a formatear
 * @param decimals - Número de decimales (por defecto 0)
 * @returns String formateado con separadores
 */
export const formatNumber = (number: number, decimals: number = 0): string => {
  if (number === null || number === undefined) return '0'
  
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number)
}

/**
 * Formatea una fecha en formato legible
 * @param date - Fecha a formatear (string, Date o timestamp)
 * @param options - Opciones de formateo
 * @returns String formateado de fecha
 */
export const formatDate = (
  date: string | Date | number, 
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
): string => {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : 
                  typeof date === 'number' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('es-PE', options).format(dateObj)
}
/**
 * Formatea una fecha y hora en formato DD/MM/YYYY
 * @param date - Fecha y hora a formatear
 * @returns String formateado de fecha y hora
 */

/**
 * Formatea una fecha y hora en formato DD/MM/YYYY (sin desfase de zona)
 */
export const formatDateTimeToDmy = (date: string | Date | number): string => {
  if (!date) return ''
  const d = parseDateNoTZ(date)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('es-PE', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).format(d)
}

/**
 * Fecha/hora corta para tablas (p. ej. Soporte TI): dd/mm/aa hh:mm:ss
 */
export const formatSoporteTiRegistro = (val: string | null | undefined): string => {
  if (val == null || val === '') return '—'
  const d = parseInstante(String(val).trim())
  if (!d) return val

  const parts = new Intl.DateTimeFormat('es-PE', {
    timeZone: TIMEZONE_PERU,
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(d)

  const map: Record<string, string> = {}
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value
  }

  return `${map.day}/${map.month}/${map.year} ${map.hour}:${map.minute}:${map.second}`
}

/**
 * Formatea un porcentaje
 * @param value - Valor a formatear (0-1 o 0-100)
 * @param isDecimal - Si el valor está en decimal (0-1) o porcentaje (0-100)
 * @param decimals - Número de decimales
 * @returns String formateado como porcentaje
 */
export const formatPercentage = (value: number, isDecimal: boolean = false, decimals: number = 2): string => {
  if (value === null || value === undefined) return '0%'
  
  const percentage = isDecimal ? value * 100 : value
  
  return new Intl.NumberFormat('es-PE', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(percentage / 100)
}

/**
 * Formatea un tamaño de archivo en bytes a formato legible
 * @param bytes - Tamaño en bytes
 * @param decimals - Número de decimales
 * @returns String formateado del tamaño
 */
export const formatFileSize = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Formatea un número de teléfono
 * @param phone - Número de teléfono
 * @returns String formateado del teléfono
 */
export const formatPhone = (phone: string): string => {
  if (!phone) return ''
  
  // Remover todos los caracteres no numéricos
  const cleaned = phone.replace(/\D/g, '')
  
  // Formatear según el patrón peruano
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  } else if (cleaned.length === 10) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`
  }
  
  return phone
}
const formatDateForBackend = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (!isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }
  return dateString
}
