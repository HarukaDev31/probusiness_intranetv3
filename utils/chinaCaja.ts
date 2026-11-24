import type { ChinaCashMovement, ChinaContainer } from '~/types/china-caja'

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

/** Fecha de hoy en China (AAAA-MM-DD): la caja se cuenta en esa hora. */
export function chinaToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

/** «Noviembre», a partir de AAAA-MM. */
export function chinaMonthName(month: string): string {
  return MONTHS[Number(month.slice(5, 7)) - 1] || ''
}

export function chinaMonthShort(month: string): string {
  return chinaMonthName(month).slice(0, 3).toLowerCase()
}

export function nextChinaMonth(month: string): string {
  const [year, number] = month.split('-').map(Number)
  return number === 12 ? `${year! + 1}-01` : `${year}-${String(number! + 1).padStart(2, '0')}`
}

export function previousChinaMonth(month: string): string {
  const [year, number] = month.split('-').map(Number)
  return number === 1 ? `${year! - 1}-12` : `${year}-${String(number! - 1).padStart(2, '0')}`
}

/** dd/mm/aaaa (o dd/mm/aa). */
export function dmy(date: string | null | undefined, shortYear = false): string {
  const [year, month, day] = (date || '').slice(0, 10).split('-')
  return day ? `${day}/${month}/${shortYear ? year!.slice(2) : year}` : ''
}

/** «09–15 nov». */
export function weekRange(week: { starts_on: string; ends_on: string }): string {
  return `${week.starts_on.slice(8)}–${week.ends_on.slice(8)} ${chinaMonthShort(week.starts_on)}`
}

/** Variación porcentual contra el periodo anterior; null si no hay con qué comparar. */
export function variation(current: number, previous: number): number | null {
  return previous ? Math.round(((current - previous) / previous) * 100) : null
}

export function variationText(percent: number | null): string {
  if (percent === null) return '—'
  return percent === 0 ? '= 0%' : `${percent > 0 ? '▲' : '▼'} ${Math.abs(percent)}%`
}

/** Verde si mejora; en egresos, subir es rojo. */
export function variationTone(percent: number | null, upIsGood: boolean): string {
  if (percent === null) return 'cc-t-faint'
  if (percent === 0) return 'cc-t-muted'
  return (percent > 0) === upIsGood ? 'cc-t-green' : 'cc-t-red'
}

export function wholeRmb(value: number): string {
  return `¥${Math.round(Math.abs(value)).toLocaleString('en-US')}`
}

/** RMB sin decimales y con el signo delante. */
export function signedRmb(value: number): string {
  return `${value < 0 ? '−' : ''}${wholeRmb(value)}`
}

/** Ficha exacta donde se registra el movimiento. */
export function movementLink(row: ChinaCashMovement): string | undefined {
  if (row.link === 'operation') return `/operaciones-china?operacion=${row.link_id}`
  if (row.link === 'payment') return `/operaciones-china?cobro=${row.link_id}`
  if (row.link === 'container') return `/estado-contenedores-china?contenedor=${row.link_id}`
  return row.link === 'request' ? `/pago-proveedor/pagos-yuanes?solicitud=${row.link_id}` : undefined
}

function daysUntil(date: string): number {
  return Math.round((Date.parse(date) - Date.parse(chinaToday())) / 864e5)
}

/** «Faltan 5 días», «Arribó hace 2 días», «Embarca en 9 días». */
export function containerArrivalText(row: ChinaContainer): string {
  const plural = (days: number) => `${days} ${days === 1 ? 'día' : 'días'}`
  if (row.status.group === 'to_sail' && row.data.sailing_on) return `Embarca en ${plural(daysUntil(row.data.sailing_on))}`
  const days = row.status.days_to_arrival
  if (days === null) return 'Sin fecha de arribo'
  if (days < 0) return `Arribó hace ${plural(-days)}`
  return days === 0 ? 'Llega hoy' : `Faltan ${plural(days)}`
}

export function containerArrivalTone(row: ChinaContainer): string {
  const sailing = row.data.sailing_on
  if (sailing && daysUntil(sailing) > 0) return 'cc-c-blue'
  const days = row.status.days_to_arrival
  if (days === null || days > 7) return 'cc-c-soft'
  return days < 0 ? 'cc-c-green' : 'cc-c-flete'
}
