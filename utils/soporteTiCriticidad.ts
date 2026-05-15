/** Complejidad de la solicitud (persistida en API como `criticidad`). Orden de menor a mayor. */
export const SOPORTE_TI_COMPLEJIDADES = ['Baja', 'Media', 'Alta', 'Máxima'] as const

export type SoporteTiComplejidad = (typeof SOPORTE_TI_COMPLEJIDADES)[number]

/** `true` si ya hay una complejidad asignada (no “Por definir” ni vacío). */
export function esComplejidadDefinida(valor: string | null | undefined): boolean {
  const s = (valor ?? '').trim().toLowerCase()
  if (!s) return false
  if (s.includes('definir')) return false
  return true
}

export function esComplejidadCatalogo(valor: string | null | undefined): valor is SoporteTiComplejidad {
  return SOPORTE_TI_COMPLEJIDADES.includes(valor as SoporteTiComplejidad)
}

/** Reglas: ¿puede pasarse a `en_progreso`? (complejidad definida + reglas tipo A/B). */
export function puedePasarAEnProgreso(ticket: {
  tipo: 'A' | 'B'
  estadoCodigo: string
  maqueta: { aprobada?: boolean } | null
  criticidad: string
}): boolean {
  if (!esComplejidadDefinida(ticket.criticidad)) return false
  if (ticket.tipo === 'A') {
    if (ticket.estadoCodigo === 'en_maqueta') {
      return Boolean(ticket.maqueta?.aprobada)
    }
    if (ticket.estadoCodigo === 'observado') return true
    return false
  }
  if (ticket.tipo === 'B') {
    return ticket.estadoCodigo === 'pendiente' || ticket.estadoCodigo === 'observado'
  }
  return false
}
