import { SoporteTiService } from '~/services/soporteTiService'
import type { SoporteTiChatPaginacion, SoporteTiChatsPorUuid, SoporteTiMensaje } from '~/types/soporteTi'
import { mapMensajeApiToUi } from '~/utils/soporteTiMappers'
import { encolarLeidosDesdeMensajes } from '~/composables/useSoporteTiChatLeidos'
import { mergeMensajesAsc } from '~/utils/soporteTiChatPaginate'
import { SOPORTE_TI_CHAT_PAGE_SIZE } from '~/constants/soporteTi'

const META_VACIA: SoporteTiChatPaginacion = {
  hasMoreOlder: false,
  oldestId: null,
  loading: false,
  loadingOlder: false,
  initialized: false
}

export function useSoporteTiChat() {
  const chats = useState<SoporteTiChatsPorUuid>('soporte-ti-chats', () => ({}))
  const chatMeta = useState<Record<string, SoporteTiChatPaginacion>>('soporte-ti-chat-meta', () => ({}))

  function metaDe(chatUuid: string): SoporteTiChatPaginacion {
    return chatMeta.value[chatUuid] ?? { ...META_VACIA }
  }

  function patchMeta(chatUuid: string, patch: Partial<SoporteTiChatPaginacion>) {
    chatMeta.value = {
      ...chatMeta.value,
      [chatUuid]: { ...metaDe(chatUuid), ...patch }
    }
  }

  function mensajesDe(chatUuid: string): SoporteTiMensaje[] {
    return chats.value[chatUuid] ?? []
  }

  function setMensajesSala(chatUuid: string, lista: SoporteTiMensaje[]) {
    chats.value = { ...chats.value, [chatUuid]: lista }
  }

  function prependMensajesSala(chatUuid: string, nuevos: SoporteTiMensaje[]) {
    setMensajesSala(chatUuid, mergeMensajesAsc(mensajesDe(chatUuid), nuevos))
  }

  function agregarMensaje(chatUuid: string, msg: SoporteTiMensaje) {
    const prev = mensajesDe(chatUuid)
    if (prev.some((m) => m.id === msg.id)) return
    if (msg.clientId && prev.some((m) => m.clientId === msg.clientId)) return
    setMensajesSala(chatUuid, [...prev, msg])
  }

  function actualizarMensajeEnSala(chatUuid: string, msg: SoporteTiMensaje) {
    setMensajesSala(
      chatUuid,
      mensajesDe(chatUuid).map((m) => {
        if (m.id === msg.id) return msg
        if (msg.clientId && m.clientId === msg.clientId) return msg
        return m
      })
    )
  }

  function reemplazarMensajeOptimista(
    chatUuid: string,
    clientId: string,
    msg: SoporteTiMensaje
  ) {
    const lista = mensajesDe(chatUuid)
    let idx = lista.findIndex((m) => m.clientId === clientId)
    if (idx < 0 && msg.id > 0) {
      idx = lista.findIndex((m) => m.id === msg.id)
    }
    if (idx < 0) {
      idx = lista.findIndex(
        (m) =>
          m.esPropio &&
          msg.esPropio &&
          m.id < 0 &&
          (m.estadoEnvio === 'pendiente' || m.estadoEnvio === 'enviando')
      )
    }
    if (idx < 0) {
      if (msg.id > 0 && lista.some((m) => m.id === msg.id)) {
        actualizarMensajeEnSala(chatUuid, { ...msg, clientId: undefined })
      } else {
        agregarMensaje(chatUuid, { ...msg, clientId: undefined })
      }
      return
    }
    const next = [...lista]
    next[idx] = { ...msg, clientId: undefined }
    setMensajesSala(chatUuid, next)
  }

  function quitarMensajeOptimista(chatUuid: string, clientId: string) {
    setMensajesSala(
      chatUuid,
      mensajesDe(chatUuid).filter((m) => m.clientId !== clientId)
    )
  }

  function resetSala(chatUuid: string) {
    const nextChats = { ...chats.value }
    delete nextChats[chatUuid]
    chats.value = nextChats
    const nextMeta = { ...chatMeta.value }
    delete nextMeta[chatUuid]
    chatMeta.value = nextMeta
  }

  async function cargarChatInicial(chatUuid: string) {
    if (!chatUuid) return
    const prevMeta = metaDe(chatUuid)
    if (prevMeta.initialized || prevMeta.loading) return

    patchMeta(chatUuid, { loading: true })
    const existentes = mensajesDe(chatUuid)
    try {
      const res = await SoporteTiService.getMensajes(chatUuid, {
        limit: SOPORTE_TI_CHAT_PAGE_SIZE
      })
      if (!res.success) throw new Error(res.message || 'Error al cargar mensajes')
      const lista = mergeMensajesAsc(res.data.map(mapMensajeApiToUi), existentes)
      setMensajesSala(chatUuid, lista)
      encolarLeidosDesdeMensajes(chatUuid, lista)
      patchMeta(chatUuid, {
        hasMoreOlder: res.pagination.has_more,
        oldestId: res.pagination.oldest_id,
        initialized: true,
        loading: false,
        loadingOlder: false
      })
    } catch {
      patchMeta(chatUuid, { loading: false, initialized: true })
    }
  }

  async function cargarMensajesAnteriores(chatUuid: string) {
    const meta = metaDe(chatUuid)
    if (!meta.initialized || !meta.hasMoreOlder || meta.loadingOlder || meta.oldestId == null) {
      return
    }

    patchMeta(chatUuid, { loadingOlder: true })
    try {
      const res = await SoporteTiService.getMensajes(chatUuid, {
        limit: SOPORTE_TI_CHAT_PAGE_SIZE,
        before_id: meta.oldestId
      })
      if (!res.success) throw new Error(res.message || 'Error')
      const nuevos = res.data.map(mapMensajeApiToUi)
      prependMensajesSala(chatUuid, nuevos)
      patchMeta(chatUuid, {
        hasMoreOlder: res.pagination.has_more,
        oldestId: res.pagination.oldest_id ?? meta.oldestId,
        loadingOlder: false
      })
    } catch {
      patchMeta(chatUuid, { loadingOlder: false })
    }
  }

  function resetChats() {
    chats.value = {}
    chatMeta.value = {}
  }

  /** Actualiza mensajes propios a "leído" tras evento WS. */
  function aplicarMensajesLeidosWs(chatUuid: string, mensajeIds: number[]) {
    if (!mensajeIds.length) return
    const ids = new Set(mensajeIds)
    setMensajesSala(
      chatUuid,
      mensajesDe(chatUuid).map((m) =>
        m.esPropio && ids.has(m.id) ? { ...m, estadoEnvio: 'leido' as const } : m
      )
    )
  }

  return {
    chats,
    mensajesDe,
    metaDe,
    setMensajesSala,
    prependMensajesSala,
    agregarMensaje,
    actualizarMensajeEnSala,
    reemplazarMensajeOptimista,
    quitarMensajeOptimista,
    resetSala,
    resetChats,
    cargarChatInicial,
    cargarMensajesAnteriores,
    aplicarMensajesLeidosWs
  }
}
