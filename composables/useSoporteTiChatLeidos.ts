import { SoporteTiService } from '~/services/soporteTiService'
import type { SoporteTiMensaje } from '~/types/soporteTi'
import { authUserIdInt } from '~/utils/soporteTiChatMensaje'

const colasPorSala = new Map<string, Set<number>>()
const timersPorSala = new Map<string, ReturnType<typeof setTimeout>>()
const yaMarcadosLocal = new Map<string, Set<number>>()

const DEBOUNCE_MS = 450

function claveSala(chatUuid: string) {
  return chatUuid
}

function obtenerMarcados(chatUuid: string): Set<number> {
  let s = yaMarcadosLocal.get(chatUuid)
  if (!s) {
    s = new Set()
    yaMarcadosLocal.set(chatUuid, s)
  }
  return s
}

async function flushCola(chatUuid: string) {
  const cola = colasPorSala.get(chatUuid)
  if (!cola || cola.size === 0) return

  const ids = [...cola]
  cola.clear()
  timersPorSala.delete(chatUuid)

  try {
    await SoporteTiService.marcarLeidos(chatUuid, ids)
    const marcados = obtenerMarcados(chatUuid)
    ids.forEach((id) => marcados.add(id))
  } catch (e) {
    console.warn('[SoporteTI] No se pudieron marcar mensajes leídos:', e)
    ids.forEach((id) => cola.add(id))
    programarFlush(chatUuid)
  }
}

function programarFlush(chatUuid: string) {
  const prev = timersPorSala.get(chatUuid)
  if (prev) clearTimeout(prev)
  timersPorSala.set(
    chatUuid,
    setTimeout(() => {
      void flushCola(chatUuid)
    }, DEBOUNCE_MS)
  )
}

/** Encola IDs de mensajes ajenos para marcar como leídos en una sola petición. */
export function encolarMarcarLeidos(chatUuid: string, mensajeIds: number[]) {
  if (!chatUuid || typeof window === 'undefined') return

  const miId = authUserIdInt()
  if (miId == null) return

  const marcados = obtenerMarcados(chatUuid)
  let cola = colasPorSala.get(chatUuid)
  if (!cola) {
    cola = new Set()
    colasPorSala.set(chatUuid, cola)
  }

  for (const id of mensajeIds) {
    if (id > 0 && !marcados.has(id)) {
      cola.add(id)
    }
  }

  if (cola.size > 0) {
    programarFlush(chatUuid)
  }
}

/** Marca como leídos los mensajes ajenos visibles en la sala activa. */
export function encolarLeidosDesdeMensajes(chatUuid: string, mensajes: SoporteTiMensaje[]) {
  const miId = authUserIdInt()
  if (miId == null) return

  const ids = mensajes
    .filter((m) => !m.esSistema && !m.esPropio && m.id > 0)
    .map((m) => m.id)

  encolarMarcarLeidos(chatUuid, ids)
}

export function limpiarColaLeidos(chatUuid?: string) {
  if (chatUuid) {
    const t = timersPorSala.get(chatUuid)
    if (t) clearTimeout(t)
    timersPorSala.delete(chatUuid)
    colasPorSala.delete(chatUuid)
    return
  }
  timersPorSala.forEach((t) => clearTimeout(t))
  timersPorSala.clear()
  colasPorSala.clear()
}
