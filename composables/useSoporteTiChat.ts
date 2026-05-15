import { computed } from 'vue'
import { SoporteTiService } from '~/services/soporteTiService'
import type { SoporteTiChatPaginacion, SoporteTiChatsPorUuid, SoporteTiMensaje } from '~/types/soporteTi'
import { mapMensajeApiToUi } from '~/utils/soporteTiMappers'
import {
  mergeMensajesAsc,
  sliceMensajesAntesDe,
  sliceUltimosMensajes
} from '~/utils/soporteTiChatPaginate'
import { getSoporteTiSeedChats } from '~/utils/soporteTiSeed'
import { SOPORTE_TI_CHAT_PAGE_SIZE } from '~/constants/soporteTi'

const META_VACIA: SoporteTiChatPaginacion = {
  hasMoreOlder: false,
  oldestId: null,
  loading: false,
  loadingOlder: false,
  initialized: false
}

export function useSoporteTiChat() {
  const config = useRuntimeConfig()
  const usarApi = computed(() => config.public.soporteTiUseApi !== false)

  const chats = useState<SoporteTiChatsPorUuid>('soporte-ti-chats', () => ({}))
  const chatMeta = useState<Record<string, SoporteTiChatPaginacion>>('soporte-ti-chat-meta', () => ({}))
  const demoChatsCompletos = useState<SoporteTiChatsPorUuid>('soporte-ti-demo-chats-full', () => ({}))

  function asegurarDemoCompleto() {
    if (Object.keys(demoChatsCompletos.value).length === 0) {
      demoChatsCompletos.value = getSoporteTiSeedChats()
    }
  }

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
    setMensajesSala(chatUuid, [...prev, msg])
  }

  function actualizarMensajeEnSala(chatUuid: string, msg: SoporteTiMensaje) {
    setMensajesSala(
      chatUuid,
      mensajesDe(chatUuid).map((m) => (m.id === msg.id ? msg : m))
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
      if (usarApi.value) {
        const res = await SoporteTiService.getMensajes(chatUuid, {
          limit: SOPORTE_TI_CHAT_PAGE_SIZE
        })
        if (!res.success) throw new Error(res.message || 'Error al cargar mensajes')
        const lista = mergeMensajesAsc(res.data.map(mapMensajeApiToUi), existentes)
        setMensajesSala(chatUuid, lista)
        patchMeta(chatUuid, {
          hasMoreOlder: res.pagination.has_more,
          oldestId: res.pagination.oldest_id,
          initialized: true,
          loading: false,
          loadingOlder: false
        })
        return
      }

      asegurarDemoCompleto()
      const todos = demoChatsCompletos.value[chatUuid] ?? []
      const { mensajes, hasMoreOlder, oldestId } = sliceUltimosMensajes(todos)
      setMensajesSala(chatUuid, mergeMensajesAsc(mensajes, existentes))
      patchMeta(chatUuid, {
        hasMoreOlder,
        oldestId,
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
      if (usarApi.value) {
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
        return
      }

      asegurarDemoCompleto()
      const todos = demoChatsCompletos.value[chatUuid] ?? []
      const { mensajes, hasMoreOlder, oldestId } = sliceMensajesAntesDe(
        todos,
        meta.oldestId,
        SOPORTE_TI_CHAT_PAGE_SIZE
      )
      if (mensajes.length) prependMensajesSala(chatUuid, mensajes)
      patchMeta(chatUuid, {
        hasMoreOlder,
        oldestId: oldestId ?? meta.oldestId,
        loadingOlder: false
      })
    } catch {
      patchMeta(chatUuid, { loadingOlder: false })
    }
  }

  function initDemoStore() {
    if (!usarApi.value && Object.keys(demoChatsCompletos.value).length === 0) {
      demoChatsCompletos.value = getSoporteTiSeedChats()
    }
  }

  function resetChats() {
    chats.value = {}
    chatMeta.value = {}
  }

  return {
    chats,
    mensajesDe,
    metaDe,
    setMensajesSala,
    prependMensajesSala,
    agregarMensaje,
    actualizarMensajeEnSala,
    resetSala,
    resetChats,
    cargarChatInicial,
    cargarMensajesAnteriores,
    initDemoStore
  }
}
