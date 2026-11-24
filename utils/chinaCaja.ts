import type { ChinaCashMovement, ChinaContainer } from '~/types/china-caja'
import { dayLabel, rmb } from '~/utils/yuanFormat'

/** Fecha de hoy en China (AAAA-MM-DD): la caja se cuenta en esa hora. */
export function chinaToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

/** Variación porcentual contra el periodo anterior; null si no hay con qué comparar. */
export function variation(current: number, previous: number): number | null {
  return previous ? Math.round(((current - previous) / Math.abs(previous)) * 100) : null
}

/** RMB con el signo delante: −¥650.00. */
export function rmbSigned(value: number): string {
  return value < 0 ? `−${rmb(Math.abs(value))}` : rmb(value)
}

export function movementAmount(row: ChinaCashMovement): string {
  return `${row.type === 'in' ? '+' : '−'}${rmb(row.amount)}`
}

/** Ficha exacta donde se registra el movimiento. */
export function movementLink(row: ChinaCashMovement): string | undefined {
  if (row.link === 'operation') return `/operaciones-china?operacion=${row.link_id}`
  if (row.link === 'payment') return `/operaciones-china?cobro=${row.link_id}`
  if (row.link === 'container') return `/estado-contenedores-china?contenedor=${row.link_id}`
  return row.link === 'request' ? `/pago-proveedor/pagos-yuanes?solicitud=${row.link_id}` : undefined
}

export function containerArrivalText(row: ChinaContainer): string {
  if (row.status.group === 'to_sail') return `Embarca ${dayLabel(row.data.sailing_on)}`
  const days = row.status.days_to_arrival
  if (days === null) return 'Sin fecha de arribo'
  if (days < 0) return `Arribó ${dayLabel(row.data.arrival_on)}`
  return days === 0 ? 'Llega hoy' : `Llega ${dayLabel(row.data.arrival_on)} · faltan ${days} d`
}
