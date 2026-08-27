import type { SoporteTiSolicitud } from '~/types/soporteTi'
import { CODE, byCode } from '~/constants/soporteTiEstados'

/** Adjust fase (tipo A) and progreso when estado changes. */
export function apply(t: SoporteTiSolicitud, nuevoCodigo: string): SoporteTiSolicitud {
  const def = byCode(nuevoCodigo)
  if (!def) return t
  let faseIndex = t.faseIndex || 0
  if (t.tipo === 'A') {
    if (nuevoCodigo === CODE.MOCKUP) faseIndex = 1
    else if (nuevoCodigo === CODE.IN_PROGRESS && faseIndex < 2) faseIndex = 2
  }
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
