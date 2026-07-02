import type { SoporteTiMensaje } from '~/types/soporteTi'
import { SOPORTE_TI_CHAT_PAGE_SIZE } from '~/constants/soporteTi'

/** Orden cronológico ascendente por id */
export function ordenarMensajesAsc(lista: SoporteTiMensaje[]): SoporteTiMensaje[] {
  return [...lista].sort((a, b) => a.id - b.id)
}

/** Últimos N mensajes (página inicial). */
export function sliceUltimosMensajes(
  todos: SoporteTiMensaje[],
  limit = SOPORTE_TI_CHAT_PAGE_SIZE
): { mensajes: SoporteTiMensaje[]; hasMoreOlder: boolean; oldestId: number | null } {
  const sorted = ordenarMensajesAsc(todos)
  if (sorted.length <= limit) {
    return {
      mensajes: sorted,
      hasMoreOlder: false,
      oldestId: sorted[0]?.id ?? null
    }
  }
  const slice = sorted.slice(-limit)
  return {
    mensajes: slice,
    hasMoreOlder: true,
    oldestId: slice[0]?.id ?? null
  }
}

/** Mensajes anteriores a `beforeId` (exclusivo). */
export function sliceMensajesAntesDe(
  todos: SoporteTiMensaje[],
  beforeId: number,
  limit = SOPORTE_TI_CHAT_PAGE_SIZE
): { mensajes: SoporteTiMensaje[]; hasMoreOlder: boolean; oldestId: number | null } {
  const sorted = ordenarMensajesAsc(todos)
  const idx = sorted.findIndex((m) => m.id >= beforeId)
  const end = idx === -1 ? sorted.length : idx
  const anteriores = sorted.slice(0, end)
  if (!anteriores.length) {
    return { mensajes: [], hasMoreOlder: false, oldestId: null }
  }
  const slice = anteriores.slice(-limit)
  return {
    mensajes: slice,
    hasMoreOlder: anteriores.length > limit,
    oldestId: slice[0]?.id ?? null
  }
}

export function mergeMensajesAsc(
  existentes: SoporteTiMensaje[],
  nuevos: SoporteTiMensaje[]
): SoporteTiMensaje[] {
  const map = new Map<number, SoporteTiMensaje>()
  for (const m of existentes) map.set(m.id, m)
  for (const m of nuevos) map.set(m.id, m)
  return ordenarMensajesAsc([...map.values()])
}
