import type { SoporteTiSolicitud } from '~/types/soporteTi'
import { CODE, byCode } from '~/constants/soporteTiEstados'

/** Fase mínima del tipo A según el estado (la barra no debe quedar atrás). */
export function faseIndexMinimoPorEstado(
  tipo: SoporteTiSolicitud['tipo'],
  estadoCodigo: string | null | undefined
): number {
  if (tipo !== 'A') return 0
  if (estadoCodigo === CODE.MOCKUP) return 1
  if (
    estadoCodigo === CODE.IN_PROGRESS
    || estadoCodigo === CODE.DONE
    || estadoCodigo === CODE.DEPLOYED
    || estadoCodigo === CODE.OBSERVED
    || estadoCodigo === CODE.OPERATIVE
  ) {
    return 2
  }
  return 0
}

export function faseIndexEfectivo(t: Pick<SoporteTiSolicitud, 'tipo' | 'faseIndex' | 'estadoCodigo'>): number {
  return Math.max(t.faseIndex || 0, faseIndexMinimoPorEstado(t.tipo, t.estadoCodigo))
}

/** Adjust fase (tipo A) and progreso when estado changes. */
export function apply(t: SoporteTiSolicitud, nuevoCodigo: string): SoporteTiSolicitud {
  const def = byCode(nuevoCodigo)
  if (!def) return t
  const faseIndex = Math.max(t.faseIndex || 0, faseIndexMinimoPorEstado(t.tipo, nuevoCodigo))
  const progreso = nuevoCodigo === CODE.OPERATIVE ? 100 : t.progreso
  return {
    ...t,
    estadoId: def.id,
    estadoCodigo: def.codigo,
    estado: def.nombre,
    faseIndex,
    progreso
  }
}
