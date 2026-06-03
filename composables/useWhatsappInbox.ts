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
  WaInboxAssignableUser,
  WaInboxComposerSendPayload
} from '~/types/whatsapp-inbox'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'
import { useUserRole } from '~/composables/auth/useUserRole'
import { formatDatePe } from '~/utils/formatters'
import {
  findConversationInList,
  parseWaInboxConversationSlug,
  waInboxConversationPath
} from '~/utils/whatsappInboxRoute'

const CONVERSATIONS_PER_PAGE = 30
const WA_INBOX_BASE_PATH = '/coordinacion/whatsapp-inbox'

export function useWhatsappInbox() {
  const route = useRoute()
  const router = useRouter()
  const { withSpinner } = useSpinner()
  const { showError, showSuccess } = useModal()
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
  const sendingMessage = ref(false)
  const loadingConversations = ref(false)
  const loadingMessages = ref(false)
  const loadingTemplates = ref(false)
  const refreshing = ref(false)
  const savingNewContact = ref(false)
  const loadingMoreConversations = ref(false)
  const error = ref<string | null>(null)

  const conversationsPagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: CONVERSATIONS_PER_PAGE,
    total: 0
  })

  const authUserId = computed(() => Number(currentId.value) || 0)

  const conversations = computed(() => allConversations.value)

  const conversationsHasMore = computed(
    () => conversationsPagination.value.current_page < conversationsPagination.value.last_page
  )

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

    // No mostrar burbuja fantasma si otro cliente encoló y falló (solo actualización por estado).
    if (msg.delivery_status === 'failed') {
      return
    }

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
      const patch: Partial<WaInboxMessage> = payload.message ?? {
        delivery_status: payload.delivery_status
      }
      messages.value[idx] = { ...messages.value[idx], ...patch }
      if (patch.delivery_status === 'failed') {
        showError(
          'No llegó a WhatsApp',
          patch.failed_reason || 'Meta rechazó la entrega. Revisa tamaño o formato del archivo.'
        )
      }
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

  function getRouteConversationSlug(): string | null {
    const p = route.params.conversation
    if (!p) return null
    const raw = Array.isArray(p) ? p[0] : String(p)
    return raw?.trim() ? raw.trim() : null
  }

  function ensureSelectedConversation() {
    if (getRouteConversationSlug()) return

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

  let resolvingRoute = false

  async function resolveRouteConversation(explicitSlug?: string) {
    const slug = explicitSlug ?? getRouteConversationSlug()
    if (!slug) return

    const parsed = parseWaInboxConversationSlug(slug)
    if (!parsed) {
      showError('Enlace no válido', 'No se reconoce este chat.')
      await router.replace(WA_INBOX_BASE_PATH)
      return
    }

    if (resolvingRoute) return
    resolvingRoute = true
    try {
      let conv = findConversationInList(allConversations.value, parsed)

      if (!conv && parsed.kind === 'id') {
        try {
          const res = await WhatsappInboxService.getMessages(parsed.id, { per_page: 1 })
          if (res?.conversation) {
            conv = res.conversation as WaInboxConversation
            upsertConversation(conv)
          }
        } catch {
          conv = undefined
        }
      }

      if (!conv && parsed.kind === 'phone') {
        try {
          const res = await WhatsappInboxService.getConversations({
            filter: filter.value,
            search: parsed.phoneE164,
            per_page: 20,
            page: 1
          })
          const rows = Array.isArray(res?.data) ? res.data : []
          conv = rows.find((c: WaInboxConversation) => c.phone_e164 === parsed.phoneE164)
          if (conv) upsertConversation(conv)
        } catch {
          conv = undefined
        }
      }

      if (!conv) {
        showError('Chat no encontrado', 'Este número o conversación no está en el inbox.')
        selectedConversationId.value = null
        messages.value = []
        await router.replace(WA_INBOX_BASE_PATH)
        return
      }

      const canonicalPath = waInboxConversationPath(conv.id)
      const needsCanonicalUrl =
        parsed.kind === 'phone' || slug !== String(conv.id)

      if (selectedConversationId.value !== conv.id) {
        await selectConversation(conv.id, { skipRoute: true })
      } else {
        await loadMessages(conv.id)
        await loadTemplates({ background: true })
      }

      if (needsCanonicalUrl && route.path !== canonicalPath) {
        await router.replace(canonicalPath)
      }
    } finally {
      resolvingRoute = false
    }
  }

  async function syncConversationFromRoute() {
    const slug = getRouteConversationSlug()
    if (slug) {
      await resolveRouteConversation(slug)
      return
    }
    ensureSelectedConversation()
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

  async function loadConversations(
    options: { page?: number; append?: boolean; background?: boolean; force?: boolean } = {}
  ) {
    const page = options.page ?? 1
    const append = options.append ?? false
    const useCache = !options.force && !append && page === 1 && !search.value.trim()

    if (useCache) {
      const cached = cache.getAllConversations()
      if (cached) {
        allConversations.value = cached
        ensureSelectedConversation()
        if (!options.background && !options.force) return
      }
    }

    if (append) {
      loadingMoreConversations.value = true
    } else if (!options.background) {
      loadingConversations.value = true
    } else {
      refreshing.value = true
    }
    error.value = null

    try {
      const res = await WhatsappInboxService.getConversations({
        filter: filter.value,
        search: search.value.trim() || undefined,
        per_page: CONVERSATIONS_PER_PAGE,
        page
      })
      const rows = Array.isArray(res?.data) ? res.data : []
      if (append) {
        const seen = new Set(allConversations.value.map((c) => c.id))
        const merged = [...allConversations.value]
        for (const row of rows) {
          if (!seen.has(row.id)) merged.push(row)
        }
        allConversations.value = sortConversationsList(merged)
      } else {
        allConversations.value = rows
      }

      if (res?.pagination) {
        conversationsPagination.value = {
          current_page: Number(res.pagination.current_page) || page,
          last_page: Number(res.pagination.last_page) || 1,
          per_page: Number(res.pagination.per_page) || CONVERSATIONS_PER_PAGE,
          total: Number(res.pagination.total) || rows.length
        }
      }

      if (page === 1 && !search.value.trim()) {
        cache.setAllConversations(allConversations.value)
      }
      ensureSelectedConversation()
    } catch (e: any) {
      if (!append) {
        if (!useCache || !cache.getAllConversations()) {
          error.value = e?.message || 'No se pudo cargar conversaciones'
          allConversations.value = []
        }
      }
    } finally {
      loadingConversations.value = false
      loadingMoreConversations.value = false
      refreshing.value = false
    }
  }

  async function loadAllConversations(options: { background?: boolean; force?: boolean } = {}) {
    await loadConversations({ page: 1, ...options })
  }

  async function loadMoreConversations() {
    if (loadingMoreConversations.value || loadingConversations.value) return
    if (!conversationsHasMore.value) return
    await loadConversations({
      page: conversationsPagination.value.current_page + 1,
      append: true,
      background: true
    })
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

  async function selectConversation(id: number, options: { skipRoute?: boolean } = {}) {
    selectedConversationId.value = id
    if (!options.skipRoute) {
      const target = waInboxConversationPath(id)
      if (route.path !== target) {
        await router.push(target)
      }
    }
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
      last_message_time_label: formatDatePe(sentAt) || msg?.time_label || ''
    })
  }

  async function sendComposerMessage(payload: WaInboxComposerSendPayload) {
    const conv = selectedConversation.value
    if (!conv) return
    if (!conv.can_send_text) {
      showError('Ventana cerrada', 'Solo puedes enviar plantillas mientras la ventana esté cerrada.')
      return
    }

    const text = payload.text.trim()
    if (!text && !payload.file) return

    sendingMessage.value = true
    try {
      const res = await WhatsappInboxService.sendMessage(conv.id, {
        message: text || undefined,
        file: payload.file,
        mediaKind: payload.mediaKind,
        replyToMetaMessageId: payload.replyToMetaMessageId
      })
      const msg = res?.data as WaInboxMessage | undefined
      if (msg?.id) {
        if (!messages.value.some((m) => m.id === msg.id)) {
          messages.value = [...messages.value, { ...msg, delivery_status: msg.delivery_status ?? 'pending' }]
        }
        cache.setMessages(conv.id, messages.value)
        const preview = text || msg.body || `[${msg.message_type || 'archivo'}]`
        patchConversationAfterOutbound(conv, preview, msg)
      }
    } catch (e: any) {
      showError('Error', e?.message || 'No se pudo enviar el mensaje')
      throw e
    } finally {
      sendingMessage.value = false
    }
  }

  const sendingTemplate = ref(false)

  async function sendTemplateMessage(
    templateName: string,
    params: Record<string, string>,
    files: Record<string, File> = {},
    fileKinds: Record<string, string> = {}
  ) {
    const conv = selectedConversation.value
    if (!conv) return

    sendingTemplate.value = true
    try {
      const res = await WhatsappInboxService.sendTemplate(conv.id, {
        template_name: templateName,
        params,
        files,
        fileKinds
      }) as { success?: boolean; message?: string; data?: WaInboxMessage }

      if (res?.success === false) {
        throw new Error(res?.message || 'No se pudo enviar la plantilla')
      }

      const msg = res?.data
      if (!msg?.id) {
        throw new Error('Respuesta inválida del servidor')
      }

      if (msg.delivery_status === 'failed') {
        throw new Error(msg.failed_reason || 'La plantilla no se pudo enviar')
      }

      if (!messages.value.some((m) => m.id === msg.id)) {
        messages.value = [...messages.value, msg]
      } else {
        const idx = messages.value.findIndex((m) => m.id === msg.id)
        if (idx >= 0) messages.value[idx] = msg
      }
      cache.setMessages(conv.id, messages.value)
      patchConversationAfterOutbound(conv, msg.body || '[Template enviado]', msg)
      showSuccess('Plantilla enviada', 'Registrada en el chat. Si ves ✗ después, el archivo puede ser demasiado grande para WhatsApp.')
    } catch (e: any) {
      showError('Error', e?.message || 'No se pudo enviar la plantilla')
    } finally {
      sendingTemplate.value = false
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

  async function createManualContact(payload: {
    contact_name: string
    phone: string
    assigned_user_id?: number | null
  }) {
    savingNewContact.value = true
    try {
      await withSpinner(async () => {
        const res = await WhatsappInboxService.createConversation(payload)
        if (!res?.success || !res?.data) {
          throw new Error(res?.message || 'No se pudo registrar el contacto')
        }

        const conv = res.data as WaInboxConversation
        upsertConversation(conv)
        selectedConversationId.value = conv.id
        messages.value = []
        cache.setMessages(conv.id, [], conv)
        await router.replace(waInboxConversationPath(conv.id))
        await loadMessages(conv.id)

        const title = res.created === false ? 'Contacto existente' : 'Contacto agregado'
        const detail = res.message
          || (res.created === false
            ? 'Este número ya estaba en el inbox.'
            : 'Puedes enviar una plantilla para iniciar la conversación.')
        showSuccess(title, detail)
      }, 'Registrando contacto…')
    } catch (e: any) {
      showError('Error', e?.message || 'No se pudo registrar el contacto')
      throw e
    } finally {
      savingNewContact.value = false
    }
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
        await syncConversationFromRoute()
        if (selectedConversationId.value && !getRouteConversationSlug()) {
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

    await syncConversationFromRoute()

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

  watch(
    () => getRouteConversationSlug(),
    async (slug, prev) => {
      if (!slug) {
        if (prev) {
          selectedConversationId.value = null
          messages.value = []
        }
        return
      }

      const parsed = parseWaInboxConversationSlug(slug)
      if (!parsed) {
        await resolveRouteConversation(slug)
        return
      }
      if (parsed.kind === 'id' && selectedConversationId.value === parsed.id) return
      if (parsed.kind === 'phone') {
        const sel = allConversations.value.find((c) => c.id === selectedConversationId.value)
        if (sel?.phone_e164 === parsed.phoneE164) return
      }
      await resolveRouteConversation(slug)
    }
  )

  watch(filter, () => {
    loadConversations({ page: 1, force: true, background: true })
  })

  let searchTimer: ReturnType<typeof setTimeout> | null = null
  watch(search, () => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      loadConversations({ page: 1, force: true, background: true })
    }, 350)
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
    sendingMessage,
    loadingConversations,
    loadingMoreConversations,
    conversationsHasMore,
    loadMoreConversations,
    loadingMessages,
    loadingTemplates,
    sendingTemplate,
    refreshing,
    savingNewContact,
    error,
    unreadTotal,
    init,
    refreshInbox,
    connectWebSocket,
    disconnectWebSocket,
    loadAllConversations,
    selectConversation,
    sendComposerMessage,
    sendTemplateMessage,
    assignConversation,
    createManualContact,
    loadTemplates
  }
}
