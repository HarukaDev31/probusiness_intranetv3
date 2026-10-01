import type {
  CalendarChargeUser,
  CalendarEventApi,
  CalendarEventCharge,
  CalendarEventStatus,
  CalendarSubtask,
  IsoDate
} from '~/types/calendar'
import { countWeekdaysBetween } from '~/utils/calendar/dates'

/**
 * Estado global de una actividad a partir de sus responsables.
 * Misma regla que el filtro por estado y el progreso del backend:
 * todos COMPLETADO → COMPLETADO; todos PENDIENTE (o sin responsables) → PENDIENTE; mezcla → PROGRESO.
 */
export const deriveStatusFromCharges = (charges: Pick<CalendarEventCharge, 'status'>[]): CalendarEventStatus => {
  if (charges.length === 0) return 'PENDIENTE'
  if (charges.every(c => c.status === 'COMPLETADO')) return 'COMPLETADO'
  if (charges.every(c => c.status === 'PENDIENTE')) return 'PENDIENTE'
  return 'PROGRESO'
}

/** Estado de un responsable a partir de sus subtareas (misma lógica que el backend). */
export const deriveStatusFromSubtasks = (subtasks: Pick<CalendarSubtask, 'status'>[]): CalendarEventStatus =>
  deriveStatusFromCharges(subtasks)

/** Usuarios responsables del evento (en el orden de los charges). */
export const getEventResponsables = (event: Pick<CalendarEventApi, 'charges'>): CalendarChargeUser[] =>
  event.charges.map(c => c.user).filter((u): u is CalendarChargeUser => u !== null)

export const findChargeOfUser = (event: Pick<CalendarEventApi, 'charges'>, userId: number): CalendarEventCharge | undefined =>
  event.charges.find(c => c.user_id === userId)

/** Primera/última fecha del evento (start_date/end_date del backend o, si faltan, de days). */
export const getEventStartDate = (event: Pick<CalendarEventApi, 'start_date' | 'days'>): IsoDate | null =>
  event.start_date ?? (event.days.length ? event.days.map(d => d.date).sort()[0] : null)

export const getEventEndDate = (event: Pick<CalendarEventApi, 'end_date' | 'days'>): IsoDate | null =>
  event.end_date ?? (event.days.length ? event.days.map(d => d.date).sort()[event.days.length - 1] : null)

/** Duración en días hábiles (mínimo 1). */
export const getEventWorkingDays = (event: Pick<CalendarEventApi, 'start_date' | 'end_date' | 'days'>): number => {
  const start = getEventStartDate(event)
  const end = getEventEndDate(event)
  if (!start || !end) return 1
  return countWeekdaysBetween(start, end) || 1
}

/** Notas separadas por línea (sin vacías). */
export const getNoteLines = (notes: string | null): string[] =>
  notes ? notes.split(/\r?\n/).map(s => s.trim()).filter(Boolean) : []

/** "Consolidado #19A" → "#19A". */
export const shortConsolidadoName = (nombre: string): string => nombre.replace(/^Consolidado\s*#?/i, '#')

/** Fondo CSS para uno o varios colores (diagonal para varios responsables). */
export const colorsToBackground = (colors: string[]): string => {
  if (colors.length <= 1) return colors[0] ?? ''
  if (colors.length === 2) return `linear-gradient(135deg, ${colors[0]} 50%, ${colors[1]} 50%)`
  const stops = colors.map((color, i) => {
    const start = (i / colors.length) * 100
    const end = ((i + 1) / colors.length) * 100
    return `${color} ${start}%, ${color} ${end}%`
  }).join(', ')
  return `linear-gradient(135deg, ${stops})`
}
