import type { SoporteTiSolicitud } from '~/types/soporteTi'
import { estadoPorCodigo } from '~/constants/soporteTiEstados'

/** Ajusta fase (solo tipo A) y progreso al cambiar estado por código. */
export function aplicarCambioEstadoEnSolicitud(
  t: SoporteTiSolicitud,
  nuevoCodigo: string
): SoporteTiSolicitud {
  const def = estadoPorCodigo(nuevoCodigo)
  if (!def) return t
  let faseIndex = t.faseIndex || 0
  if (t.tipo === 'A') {
    if (nuevoCodigo === 'en_maqueta') faseIndex = 1
    else if (nuevoCodigo === 'en_progreso' && faseIndex < 2) faseIndex = 2
  }
  const progreso = nuevoCodigo === 'operativo' ? 100 : t.progreso
  return {
    ...t,
    estadoId: def.id,
    estadoCodigo: def.codigo,
    estado: def.nombre,
    faseIndex,
    progreso
  }
}
