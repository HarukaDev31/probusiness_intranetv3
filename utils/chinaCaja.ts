import { rmb } from '~/utils/yuanFormat'

/** Fecha de hoy en China (AAAA-MM-DD): la caja se cuenta en esa hora. */
export function chinaToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

/** Variación porcentual contra el periodo anterior; null si no hay con qué comparar. */
export function variation(current: number, previous: number): number | null {
  return previous ? Math.round(((current - previous) / previous) * 100) : null
}

/** RMB con el signo delante: −¥650.00. */
export function rmbSigned(value: number): string {
  return value < 0 ? `−${rmb(Math.abs(value))}` : rmb(value)
}
