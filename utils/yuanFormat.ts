const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function amount(value: number | null | undefined): string {
  return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export const usd = (value: number | null | undefined): string => `$${amount(value)}`

export const rmb = (value: number | null | undefined): string => `¥${amount(value)}`

/** «05 oct» y «Oct 2026», a partir de una fecha AAAA-MM-DD. */
export function dayLabel(date: string | null | undefined): string {
  const [, month, day] = (date || '').split('-')
  return month ? `${day} ${(MONTHS[Number(month) - 1] || '').toLowerCase()}` : '—'
}

export function monthLabel(date: string | null | undefined): string {
  const [year, month] = (date || '').split('-')
  return month ? `${MONTHS[Number(month) - 1]} ${year}` : ''
}

export function roundTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
