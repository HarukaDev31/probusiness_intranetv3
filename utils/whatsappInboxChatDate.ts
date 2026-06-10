import { TIMEZONE_PERU, formatDateTimeToDmy } from '~/utils/formatters'

function parseInstante(val: string | Date | number | null | undefined): Date | null {
  if (val == null) return null
  if (val instanceof Date) return Number.isNaN(val.getTime()) ? null : val
  if (typeof val === 'number') {
    const d = new Date(val)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const s = String(val).trim()
  if (!s) return null
  const d = /\d{4}-\d{2}-\d{2}T\d/.test(s) || /Z$/i.test(s) || /[+-]\d{2}:\d{2}$/.test(s)
    ? new Date(s)
    : new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Clave YYYY-MM-DD en hora Perú para agrupar mensajes por día. */
export function waChatDayKey(val: string | Date | number | null | undefined): string {
  const d = parseInstante(val)
  if (!d) return ''
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_PERU,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d)
}

function capitalizeEs(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Etiqueta de día estilo WhatsApp: Hoy, Ayer, nombre del día o fecha d/m/aaaa.
 */
export function formatWaChatDayLabel(val: string | Date | number | null | undefined): string {
  const d = parseInstante(val)
  if (!d) return ''

  const key = waChatDayKey(d)
  const todayKey = waChatDayKey(new Date())
  if (key === todayKey) return 'Hoy'

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (key === waChatDayKey(yesterday)) return 'Ayer'

  const dayDiff = Math.round(
    (Date.parse(`${todayKey}T12:00:00`) - Date.parse(`${key}T12:00:00`))
      / (1000 * 60 * 60 * 24)
  )
  if (dayDiff > 0 && dayDiff < 7) {
    const weekday = new Intl.DateTimeFormat('es-PE', {
      timeZone: TIMEZONE_PERU,
      weekday: 'long'
    }).format(d)
    return capitalizeEs(weekday)
  }

  return formatDateTimeToDmy(d)
}

/** Marca para info del mensaje: «Ayer a la(s) 10:30 p. m.» */
export function formatWaMessageStatusTime(val: string | Date | number | null | undefined): string {
  const d = parseInstante(val)
  if (!d) return ''

  const day = formatWaChatDayLabel(d)
  const time = new Intl.DateTimeFormat('es-PE', {
    timeZone: TIMEZONE_PERU,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(d)

  if (day === 'Hoy' || day === 'Ayer') return `${day} a la(s) ${time}`
  if (!day.includes('/')) return `${day} a la(s) ${time}`
  return `${day} ${time}`
}
