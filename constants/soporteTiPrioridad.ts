/** 1 = más urgente */
export const SOPORTE_TI_PRIORIDADES = [
  { label: 'Alta', value: 1 },
  { label: 'Media', value: 2 },
  { label: 'Baja', value: 3 }
] as const

export type SoporteTiPrioridadValor = (typeof SOPORTE_TI_PRIORIDADES)[number]['value']

export function prioridadOk(v: unknown): v is SoporteTiPrioridadValor {
  const n = typeof v === 'number' ? v : Number(v)
  return n === 1 || n === 2 || n === 3
}

export function etiquetaPrioridad(v: number): string {
  const f = SOPORTE_TI_PRIORIDADES.find((p) => p.value === v)
  return f?.label ?? 'Media'
}
