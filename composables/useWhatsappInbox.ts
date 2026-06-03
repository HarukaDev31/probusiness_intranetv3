import { WhatsappInboxService } from '~/services/whatsappInbox/whatsappInboxService'
import { useWaInboxCache } from '~/composables/whatsapp-inbox/waInboxCache'
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
  const { showSuccess, showError } = useModal()
  const { currentId } = useUserRole()
  const cache = useWaInboxCache()

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
    await loadMessages(id)
  }

  async function sendTextMessage() {
    const conv = selectedConversation.value
    const text = draftMessage.value.trim()
    if (!conv || !text) return
    if (!conv.can_send_text) {
      showError('Ventana cerrada', 'Solo puedes enviar plantillas mientras la ventana esté cerrada.')
      return
    }

    await withSpinner(async () => {
      const res = await WhatsappInboxService.sendMessage(conv.id, text)
      if (res?.data) {
        messages.value = [...messages.value, res.data]
        cache.setMessages(conv.id, messages.value)
      }
      draftMessage.value = ''
      cache.invalidateConversations()
      await loadAllConversations({ background: true, force: true })
    }, 'Enviando…')
    showSuccess('Enviado', 'El mensaje se encoló para envío por WhatsApp.')
  }

  async function sendTemplateMessage(templateName: string, params: Record<string, string>) {
    const conv = selectedConversation.value
    if (!conv) return

    await withSpinner(async () => {
      const res = await WhatsappInboxService.sendTemplate(conv.id, {
        template_name: templateName,
        params
      })
      if (res?.data) {
        messages.value = [...messages.value, res.data]
        cache.setMessages(conv.id, messages.value)
      }
      cache.invalidateConversations()
      cache.invalidateMessages(conv.id)
      await loadAllConversations({ background: true, force: true })
      if (selectedConversationId.value) {
        await loadMessages(selectedConversationId.value, { background: true })
      }
    }, 'Enviando plantilla…')
    showSuccess('Plantilla', 'En cola de envío por Meta.')
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

  async function loadTemplates(options: { background?: boolean } = {}) {
    const cached = cache.getTemplates()
    if (cached) {
      templates.value = cached
      if (!options.background) return
    }

    const res = await WhatsappInboxService.getTemplates()
    templates.value = Array.isArray(res?.data) ? res.data : []
    cache.setTemplates(templates.value)
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

  async function init() {
    hydrateFromCache()
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
        loadTemplates({ background: true }),
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
    refreshing,
    error,
    unreadTotal,
    init,
    refreshInbox,
    loadAllConversations,
    selectConversation,
    sendTextMessage,
    sendTemplateMessage,
    assignConversation,
    loadTemplates
  }
}
