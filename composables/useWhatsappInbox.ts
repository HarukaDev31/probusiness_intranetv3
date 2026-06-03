import { WhatsappInboxService } from '~/services/whatsappInbox/whatsappInboxService'
import { useWaInboxCache } from '~/composables/whatsapp-inbox/waInboxCache'
import { useWaInboxWebSocket } from '~/composables/whatsapp-inbox/useWaInboxWebSocket'
import type {
  WaInboxWsMessageCreatedPayload,
  WaInboxWsMessageStatusPayload
} from '~/types/whatsapp-inbox-ws'
import type {
  WaInboxConversation,
  WaInboxFilter,
  WaInboxMessage,
  WaInboxSession,
  WaInboxTemplate,
  WaInboxAssignableUser
} from '~/types/whatsapp-inbox'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'
import { useUserRole } from '~/composables/auth/useUserRole'

function matchesSearch(c: WaInboxConversation, q: string) {
  if (!q) return true
  const needle = q.toLowerCase()
  return (
    (c.contact_name || '').toLowerCase().includes(needle)
    || (c.phone_display || '').toLowerCase().includes(needle)
    || (c.phone_e164 || '').includes(needle)
  )
}

function applyClientFilter(
  list: WaInboxConversation[],
  filter: WaInboxFilter,
  authUserId: number
) {
  if (filter === 'sin-asignar') {
    return list.filter((c) => !c.assigned_user_id)
  }
  if (filter === 'mis' && authUserId > 0) {
    return list.filter((c) => c.assigned_user_id === authUserId)
  }
  if (filter === 'cerradas') {
    return list.filter((c) => c.status === 'closed')
  }
  return list
}

export function useWhatsappInbox() {
  const { withSpinner } = useSpinner()
  const { showError } = useModal()
  const { currentId } = useUserRole()
  const cache = useWaInboxCache()
  const waInboxWs = useWaInboxWebSocket()

  const session = ref<WaInboxSession | null>(null)
  const allConversations = ref<WaInboxConversation[]>([])
  const messages = ref<WaInboxMessage[]>([])
  const templates = ref<WaInboxTemplate[]>([])
  const assignableUsers = ref<WaInboxAssignableUser[]>([])

  const selectedConversationId = ref<number | null>(null)
  const search = ref('')
  const filter = ref<WaInboxFilter>('todas')
  const draftMessage = ref('')
  const loadingConversations = ref(false)
  const loadingMessages = ref(false)
  const loadingTemplates = ref(false)
  const refreshing = ref(false)
  const error = ref<string | null>(null)

  const authUserId = computed(() => Number(currentId.value) || 0)

  const conversations = computed(() => {
    const q = search.value.trim()
    const filtered = applyClientFilter(allConversations.value, filter.value, authUserId.value)
    return filtered.filter((c) => matchesSearch(c, q))
  })

  const selectedConversation = computed(() =>
    allConversations.value.find((c) => c.id === selectedConversationId.value)
    ?? conversations.value.find((c) => c.id === selectedConversationId.value)
    ?? null
  )

  const unreadTotal = computed(() =>
    allConversations.value.reduce((sum, c) => sum + (c.unread_count || 0), 0)
  )

  function hydrateFromCache() {
    const cachedSession = cache.getSession()
    if (cachedSession) session.value = cachedSession

    const cachedTemplates = cache.getTemplates()
    if (cachedTemplates) templates.value = cachedTemplates

    const cachedAssignable = cache.getAssignable()
    if (cachedAssignable) assignableUsers.value = cachedAssignable

    const cachedConvs = cache.getAllConversations()
    if (cachedConvs) {
      allConversations.value = cachedConvs
      ensureSelectedConversation()
    }
  }

  function sortConversationsList(list: WaInboxConversation[]) {
    return [...list].sort((a, b) => {
      const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
      const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
      if (tb !== ta) return tb - ta
      return b.id - a.id
    })
  }

  function upsertConversation(conv: WaInboxConversation) {
    const idx = allConversations.value.findIndex((c) => c.id === conv.id)
    if (idx >= 0) {
      allConversations.value[idx] = { ...allConversations.value[idx], ...conv }
    } else {
      allConversations.value = [conv, ...allConversations.value]
    }
    allConversations.value = sortConversationsList(allConversations.value)
    cache.setAllConversations(allConversations.value)
  }

  function applyRealtimeMessage(payload: WaInboxWsMessageCreatedPayload) {
    const convId = payload.conversation_id
    if (payload.conversation) {
      const viewing = selectedConversationId.value === convId
      const patch = { ...payload.conversation }
      if (viewing) {
        patch.unread_count = 0
      }
      upsertConversation(patch as WaInboxConversation)
    }

    const msg = payload.message
    if (!msg?.id) return

    if (selectedConversationId.value === convId) {
      if (!messages.value.some((m) => m.id === msg.id)) {
        messages.value = [...messages.value, msg]
        cache.appendMessage(convId, msg)
      }
      if (msg.direction === 'in') {
        WhatsappInboxService.markRead(convId).catch(() => {})
      }
    } else {
      cache.appendMessage(convId, msg)
    }
  }

  function applyRealtimeStatus(payload: WaInboxWsMessageStatusPayload) {
    const convId = payload.conversation_id
    const idx = messages.value.findIndex((m) => m.id === payload.message_id)
    if (selectedConversationId.value === convId && idx >= 0) {
      const patch = payload.message ?? { delivery_status: payload.delivery_status }
      messages.value[idx] = { ...messages.value[idx], ...patch }
      const cached = cache.getMessages(convId)
      if (cached) {
        cache.setMessages(convId, messages.value, cached.conversationPatch)
      }
    } else if (convId) {
      const cached = cache.getMessages(convId)
      if (cached) {
        const mi = cached.messages.findIndex((m) => m.id === payload.message_id)
        if (mi >= 0) {
          cached.messages[mi] = {
            ...cached.messages[mi],
            ...(payload.message ?? { delivery_status: payload.delivery_status })
          }
          cache.setMessages(convId, cached.messages, cached.conversationPatch)
        }
      }
    }
  }

  function ensureSelectedConversation() {
    const list = conversations.value
    if (!list.length) {
      selectedConversationId.value = null
      messages.value = []
      return
    }
    const still = selectedConversationId.value
      && list.some((c) => c.id === selectedConversationId.value)
    if (!still) {
      selectedConversationId.value = list[0].id
    }
  }

  async function loadSession(options: { background?: boolean } = {}) {
    const cached = cache.getSession()
    if (cached) {
      session.value = cached
      if (!options.background) return
    }

    const res = await WhatsappInboxService.getSession()
    session.value = res?.data ?? null
    cache.setSession(session.value)
  }

  async function loadAllConversations(options: { background?: boolean; force?: boolean } = {}) {
    const cached = !options.force ? cache.getAllConversations() : null
    if (cached) {
      allConversations.value = cached
      ensureSelectedConversation()
      if (!options.background && !options.force) return
    }

    if (!options.background) {
      loadingConversations.value = true
    } else {
      refreshing.value = true
    }
    error.value = null

    try {
      const res = await WhatsappInboxService.getConversations({
        filter: 'todas',
        per_page: 100
      })
      allConversations.value = Array.isArray(res?.data) ? res.data : []
      cache.setAllConversations(allConversations.value)
      ensureSelectedConversation()
    } catch (e: any) {
      if (!cached) {
        error.value = e?.message || 'No se pudo cargar conversaciones'
        allConversations.value = []
      }
    } finally {
      loadingConversations.value = false
      refreshing.value = false
    }
  }

  async function loadMessages(conversationId: number, options: { background?: boolean } = {}) {
    const cached = cache.getMessages(conversationId)
    if (cached) {
      messages.value = cached.messages
      if (cached.conversationPatch) {
        cache.patchConversation(conversationId, cached.conversationPatch)
        const idx = allConversations.value.findIndex((c) => c.id === conversationId)
        if (idx >= 0) {
          allConversations.value[idx] = { ...allConversations.value[idx], ...cached.conversationPatch }
        }
      }
      if (!options.background) {
        WhatsappInboxService.markRead(conversationId).catch(() => {})
        const c = allConversations.value.find((x) => x.id === conversationId)
        if (c) {
          c.unread_count = 0
          cache.patchConversation(conversationId, { unread_count: 0 })
        }
      }
      if (!options.background) return
    }

    if (!cached) {
      loadingMessages.value = true
    }

    try {
      const res = await WhatsappInboxService.getMessages(conversationId, { per_page: 200 })
      messages.value = Array.isArray(res?.data) ? res.data : []
      const convPatch = res?.conversation as Partial<WaInboxConversation> | undefined
      cache.setMessages(conversationId, messages.value, convPatch)
      if (convPatch) {
        cache.patchConversation(conversationId, convPatch)
        const idx = allConversations.value.findIndex((c) => c.id === conversationId)
        if (idx >= 0) {
          allConversations.value[idx] = { ...allConversations.value[idx], ...convPatch }
        }
      }
      await WhatsappInboxService.markRead(conversationId)
      const c = allConversations.value.find((x) => x.id === conversationId)
      if (c) {
        c.unread_count = 0
        cache.patchConversation(conversationId, { unread_count: 0 })
      }
    } catch (e: any) {
      if (!cached) {
        showError('Error', e?.message || 'No se pudo cargar mensajes')
        messages.value = []
      }
    } finally {
      loadingMessages.value = false
    }
  }

  async function selectConversation(id: number) {
    selectedConversationId.value = id
    await Promise.all([
      loadMessages(id),
      loadTemplates({ background: true })
    ])
  }

  function patchConversationAfterOutbound(
    conv: WaInboxConversation,
    preview: string,
    msg?: WaInboxMessage
  ) {
    const sentAt = msg?.sent_at ?? new Date().toISOString()
    upsertConversation({
      ...conv,
      last_message_preview: preview.slice(0, 200),
      last_message_at: sentAt,
      last_message_time_label: msg?.time_label
        || new Date(sentAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    })
  }

  async function sendTextMessage() {
    const conv = selectedConversation.value
    const text = draftMessage.value.trim()
    if (!conv || !text) return
    if (!conv.can_send_text) {
      showError('Ventana cerrada', 'Solo puedes enviar plantillas mientras la ventana esté cerrada.')
      return
    }

    draftMessage.value = ''

    try {
      const res = await WhatsappInboxService.sendMessage(conv.id, text)
      const msg = res?.data as WaInboxMessage | undefined
      if (msg?.id) {
        if (!messages.value.some((m) => m.id === msg.id)) {
          messages.value = [...messages.value, { ...msg, delivery_status: msg.delivery_status ?? 'pending' }]
        }
        cache.setMessages(conv.id, messages.value)
        patchConversationAfterOutbound(conv, text, msg)
      }
    } catch (e: any) {
      draftMessage.value = text
      showError('Error', e?.message || 'No se pudo enviar el mensaje')
    }
  }

  async function sendTemplateMessage(templateName: string, params: Record<string, string>) {
    const conv = selectedConversation.value
    if (!conv) return

    try {
      const res = await WhatsappInboxService.sendTemplate(conv.id, {
        template_name: templateName,
        params
      })
      const msg = res?.data as WaInboxMessage | undefined
      if (msg?.id) {
        if (!messages.value.some((m) => m.id === msg.id)) {
          messages.value = [...messages.value, { ...msg, delivery_status: msg.delivery_status ?? 'pending' }]
        }
        cache.setMessages(conv.id, messages.value)
        patchConversationAfterOutbound(conv, msg.body || '[Template enviado]', msg)
      }
    } catch (e: any) {
      showError('Error', e?.message || 'No se pudo enviar la plantilla')
    }
  }

  async function assignConversation(userId: number | null) {
    const conv = selectedConversation.value
    if (!conv) return

    await withSpinner(async () => {
      const res = await WhatsappInboxService.assign(conv.id, userId)
      if (res?.data) {
        const idx = allConversations.value.findIndex((c) => c.id === conv.id)
        if (idx >= 0) {
          allConversations.value[idx] = res.data
          cache.patchConversation(conv.id, res.data)
        }
      }
    }, 'Asignando…')
  }

  async function loadTemplates(options: { background?: boolean; force?: boolean } = {}) {
    const cached = !options.force ? cache.getTemplates() : null
    if (cached?.length) {
      templates.value = cached
      if (!options.background && !options.force) return
    }

    if (!options.background) {
      loadingTemplates.value = true
    }

    try {
      const res = await WhatsappInboxService.getTemplates()
      templates.value = Array.isArray(res?.data) ? res.data : []
      cache.setTemplates(templates.value)
    } catch {
      if (!cached?.length) {
        templates.value = []
      }
    } finally {
      loadingTemplates.value = false
    }
  }

  async function loadAssignableUsers(options: { background?: boolean } = {}) {
    const cached = cache.getAssignable()
    if (cached) {
      assignableUsers.value = cached
      if (!options.background) return
    }

    const res = await WhatsappInboxService.getAssignableUsers()
    assignableUsers.value = Array.isArray(res?.data) ? res.data : []
    cache.setAssignable(assignableUsers.value)
  }

  function connectWebSocket() {
    waInboxWs.connect({
      onMessageCreated: applyRealtimeMessage,
      onMessageStatusUpdated: applyRealtimeStatus
    })
  }

  function disconnectWebSocket() {
    waInboxWs.disconnect()
  }

  async function init() {
    hydrateFromCache()
    connectWebSocket()
    const hasCachedUi = Boolean(
      cache.getSession()
      || cache.getAllConversations()?.length
    )

    if (!hasCachedUi) {
      await withSpinner(async () => {
        await Promise.all([
          loadSession(),
          loadAllConversations(),
          loadTemplates(),
          loadAssignableUsers()
        ])
        if (selectedConversationId.value) {
          await loadMessages(selectedConversationId.value)
        }
      }, 'Cargando inbox…')
      return
    }

    await Promise.all([
      loadSession({ background: true }),
      loadAllConversations({ background: true }),
      loadTemplates({ background: true }),
      loadAssignableUsers({ background: true })
    ])

    if (selectedConversationId.value) {
      const id = selectedConversationId.value
      const msgCached = cache.getMessages(id)
      if (msgCached) {
        messages.value = msgCached.messages
      }
      loadMessages(id, { background: true })
    }
  }

  async function refreshInbox() {
    cache.invalidateAll()
    await withSpinner(async () => {
      await Promise.all([
        loadSession(),
        loadAllConversations({ force: true }),
        loadTemplates({ background: true, force: true }),
        loadAssignableUsers({ background: true })
      ])
      if (selectedConversationId.value) {
        cache.invalidateMessages(selectedConversationId.value)
        await loadMessages(selectedConversationId.value)
      }
    }, 'Actualizando…')
  }

  watch(filter, () => {
    ensureSelectedConversation()
  })

  let searchTimer: ReturnType<typeof setTimeout> | null = null
  watch(search, () => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => ensureSelectedConversation(), 150)
  })

  return {
    session,
    conversations,
    allConversations,
    messages,
    templates,
    assignableUsers,
    selectedConversationId,
    selectedConversation,
    search,
    filter,
    draftMessage,
    loadingConversations,
    loadingMessages,
    loadingTemplates,
    refreshing,
    error,
    unreadTotal,
    init,
    refreshInbox,
    connectWebSocket,
    disconnectWebSocket,
    loadAllConversations,
    selectConversation,
    sendTextMessage,
    sendTemplateMessage,
    assignConversation,
    loadTemplates
  }
}
