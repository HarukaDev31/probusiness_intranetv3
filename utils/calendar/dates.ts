import { CalendarDate, parseDate } from '@internationalized/date'
import type { IsoDate } from '~/types/calendar'

/** Cualquier valor con año/mes/día (CalendarDate, DateValue de UCalendar, etc.). */
export interface YearMonthDay {
  year: number
  month: number
  day: number
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/** { year, month, day } → "YYYY-MM-DD". */
export const toIsoDate = (d: YearMonthDay): IsoDate => `${d.year}-${pad2(d.month)}-${pad2(d.day)}`

/** "YYYY-MM-DD" → CalendarDate; null si el texto no es una fecha válida. */
export const parseIsoDate = (value: string | null | undefined): CalendarDate | null => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  try {
    return parseDate(value)
  } catch {
    return null
  }
}

/** Normaliza el valor de UCalendar (DateValue) a CalendarDate. */
export const toCalendarDate = (value: YearMonthDay | null | undefined): CalendarDate | null =>
  value ? new CalendarDate(value.year, value.month, value.day) : null

/** "YYYY-MM-DD" → "DD/MM/YYYY". */
export const formatIsoDate = (value: IsoDate | null | undefined, empty = '—'): string => {
  if (!value) return empty
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

/** 0 = lunes … 6 = domingo (columnas de la grilla del calendario). */
export const mondayBasedWeekday = (d: YearMonthDay): number => {
  const jsDay = new Date(d.year, d.month - 1, d.day).getDay()
  return (jsDay + 6) % 7
}

export const isWeekend = (d: YearMonthDay): boolean => mondayBasedWeekday(d) >= 5

export const isWeekendIso = (value: IsoDate): boolean => {
  const d = parseIsoDate(value)
  return d ? isWeekend(d) : false
}

/** Primer y último día del mes. */
export const monthRange = (year: number, month: number): { start: IsoDate; end: IsoDate } => {
  const first = new CalendarDate(year, month, 1)
  const last = first.set({ day: first.calendar.getDaysInMonth(first) })
  return { start: toIsoDate(first), end: toIsoDate(last) }
}

/** Días hábiles (lun–vie) entre dos fechas, inclusive. */
export const countWeekdaysBetween = (start: IsoDate, end: IsoDate): number => {
  const from = parseIsoDate(start)
  const to = parseIsoDate(end)
  if (!from || !to || from.compare(to) > 0) return 0
  let count = 0
  for (let cur = from; cur.compare(to) <= 0; cur = cur.add({ days: 1 })) {
    if (!isWeekend(cur)) count++
  }
  return count
}

/** Diferencia en meses entre dos fechas ISO (solo año/mes). */
export const monthsBetween = (start: IsoDate, end: IsoDate): number => {
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  return (ey * 12 + em) - (sy * 12 + sm)
}
