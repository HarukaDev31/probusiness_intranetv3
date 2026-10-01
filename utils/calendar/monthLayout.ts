import { CalendarDate } from '@internationalized/date'
import type { CalendarEvent, IsoDate } from '~/types/calendar'
import { MONTHS } from '~/constants/calendar'
import { isWeekend, isWeekendIso, mondayBasedWeekday, toIsoDate } from '~/utils/calendar/dates'

export interface CalendarDayCell {
  date: CalendarDate
  dateStr: IsoDate
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
}

/** Tramo de un evento dentro de una semana (columnas 0 = lunes … 6 = domingo). */
export interface EventSpan {
  event: CalendarEvent
  startCol: number
  endCol: number
  /** El evento empieza en este tramo (se muestra título). */
  isStart: boolean
  /** El evento termina en este tramo (se muestran estado y responsables). */
  isEnd: boolean
}

export interface CalendarWeek {
  days: CalendarDayCell[]
  /** Filas sin solapamiento; la altura de la semana depende de cuántas haya. */
  eventRows: EventSpan[][]
}

export interface CalendarMonth {
  key: string
  title: string
  weeks: CalendarWeek[]
}

/** Días visibles del mes (semanas completas lunes–domingo, con días del mes anterior/siguiente). */
const buildMonthDays = (year: number, month: number, todayIso: IsoDate): CalendarDayCell[] => {
  const first = new CalendarDate(year, month, 1)
  const daysInMonth = first.calendar.getDaysInMonth(first)
  const leading = mondayBasedWeekday(first)
  const total = Math.ceil((leading + daysInMonth) / 7) * 7

  return Array.from({ length: total }, (_, i) => {
    const date = first.add({ days: i - leading })
    const dateStr = toIsoDate(date)
    return {
      date,
      dateStr,
      day: date.day,
      isCurrentMonth: date.month === month && date.year === year,
      isToday: dateStr === todayIso,
      isWeekend: isWeekend(date)
    }
  })
}

/**
 * Columnas de la semana donde se dibuja el evento. Sábado y domingo solo se pintan
 * si el evento cae exclusivamente en fin de semana (jue→lun se ve jue, vie y lun).
 */
const weekdaySegments = (
  startCol: number,
  endCol: number,
  days: CalendarDayCell[],
  start: IsoDate,
  end: IsoDate
): { startCol: number; endCol: number }[] => {
  const onlyWeekend = isWeekendIso(start) && isWeekendIso(end)
  const include = (col: number) => {
    const dateStr = days[col].dateStr
    if (dateStr < start || dateStr > end) return false
    return col <= 4 || onlyWeekend
  }
  const segments: { startCol: number; endCol: number }[] = []
  let segStart: number | null = null
  for (let col = startCol; col <= endCol; col++) {
    if (include(col)) {
      if (segStart === null) segStart = col
    } else if (segStart !== null) {
      segments.push({ startCol: segStart, endCol: col - 1 })
      segStart = null
    }
  }
  if (segStart !== null) segments.push({ startCol: segStart, endCol })
  return segments
}

/** Ubica el tramo en la primera fila donde no se solape. */
const placeInRows = (rows: EventSpan[][], span: EventSpan) => {
  const row = rows.find(r => r.every(s => span.endCol < s.startCol || span.startCol > s.endCol))
  if (row) row.push(span)
  else rows.push([span])
}

const buildWeek = (days: CalendarDayCell[], events: CalendarEvent[]): CalendarWeek => {
  const weekStart = days[0].dateStr
  const weekEnd = days[6].dateStr
  // Solo se dibujan tramos en días del mes mostrado (no se repiten eventos del mes vecino)
  const monthCols = days.flatMap((d, col) => (d.isCurrentMonth ? [col] : []))
  const eventRows: EventSpan[][] = []

  for (const event of events) {
    const start = event.start_date
    const end = event.end_date
    if (!start || !end || start > weekEnd || end < weekStart) continue

    const startCol = Math.max(0, days.findIndex(d => d.dateStr >= start))
    let endCol = 0
    days.forEach((d, col) => { if (d.dateStr <= end) endCol = col })

    for (const seg of weekdaySegments(startCol, endCol, days, start, end)) {
      const clipStart = monthCols.find(c => c >= seg.startCol && c <= seg.endCol)
      const clipEnd = [...monthCols].reverse().find(c => c >= seg.startCol && c <= seg.endCol)
      if (clipStart === undefined || clipEnd === undefined) continue
      const from = days[clipStart].dateStr
      const to = days[clipEnd].dateStr
      placeInRows(eventRows, {
        event,
        startCol: clipStart,
        endCol: clipEnd,
        isStart: start >= from && start <= to,
        isEnd: end >= from && end <= to
      })
    }
  }
  return { days, eventRows }
}

/** Mes completo listo para pintar; events debe venir en el orden de visualización. */
export const buildCalendarMonth = (year: number, month: number, events: CalendarEvent[], todayIso: IsoDate): CalendarMonth => {
  const days = buildMonthDays(year, month, todayIso)
  const weeks: CalendarWeek[] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(buildWeek(days.slice(i, i + 7), events))
  }
  return { key: `${year}-${month}`, title: `${MONTHS[month - 1]} ${year}`, weeks }
}
