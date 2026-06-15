import { WaCopilotoService } from '~/services/wa-copiloto/waCopilotoService'
import { useWaCopilotoCache } from '~/composables/wa-copiloto-inbox/waCopilotoCache'
import { useWaCopilotoWebSocket } from '~/composables/wa-copiloto-inbox/useWaCopilotoWebSocket'
import type {
  WaCopilotoWsMessageCreatedPayload,
  WaCopilotoWsMessageInsightsPayload,
  WaCopilotoWsMessageStatusPayload
} from '~/types/wa-copiloto-ws'
import type {
  WaCopilotoConversation,
  WaCopilotoFilter,
  WaCopilotoMessage,
  WaCopilotoMessageInsight,
  WaCopilotoSession,
  WaCopilotoTemplate,
  WaCopilotoAssignableUser,
  WaCopilotoComposerSendPayload
} from '~/types/wa-copiloto'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'
import { useUserRole } from '~/composables/auth/useUserRole'
import { formatDatePe } from '~/utils/formatters'
import {
  findConversationInList,
  parseWaCopilotoConversationSlug,
  waCopilotoConversationPath
} from '~/utils/waCopilotoRoute'
import {
  copilotoBasePath,
  copilotoConversationPath,
  copilotoConversationIdFromSlug,
  copilotoListPath,
  copilotoRouteConversationSlug,
  type CopilotoRouteScope
} from '~/utils/copilotoRoute'
import {
  mergeWaCopilotoMessage,
  mergeMessageLists,
  waMessageNumericId
} from '~/composables/wa-copiloto-inbox/waCopilotoMessageUtils'
import {
  setWaCopilotoViewingConversationId,
  getWaCopilotoViewingConversationId,
  mergeWaCopilotoStatusIntoMessage,
  resolveWaCopilotoDeliveryStatus
} from '~/composables/wa-copiloto-inbox/waCopilotoRealtimeSync'
import {
  clearWaCopilotoAnalysisPending,
  isWaCopilotoAnalysisPending,
  markWaCopilotoAnalysisPending,
  syncWaCopilotoPendingAnalysisForMessages,
  waCopilotoInsightsFichaByPhone,
  waCopilotoPendingAnalysis
} from '~/composables/wa-copiloto-inbox/waCopilotoInsightsStore'
import { registerWaCopilotoUiHandlers, getWaCopilotoUiHandlers } from '~/composables/wa-copiloto-inbox/waCopilotoUiBridge'
import { ensureWaCopilotoEchoChannel } from '~/composables/wa-copiloto-inbox/ensureWaCopilotoEchoChannel'
import { bindWaCopilotoLiveHandlers, getWaCopilotoLiveHandlers } from '~/composables/wa-copiloto-inbox/waCopilotoLiveBridge'
import {
  exposeWaCopilotoWsDiagnostics,
  WaCopilotoLog,
  WaCopilotoTrace,
  waCopilotoWarn
} from '~/composables/wa-copiloto-inbox/waCopilotoWsLog'
import { getEchoInstance } from '~/composables/websocket/useEcho'
import { WA_COPILOTO_WS_CHANNEL } from '~/constants/waCopilotoWs'
import { conversationPatchFromWaInboxMessage } from '~/utils/whatsappInboxSidebarPreview'
import { dispatchWaInboxComposerSends } from '~/utils/whatsappInboxComposerSend'

const CONVERSATIONS_PER_PAGE = 30
const WA_COPILOTO_BASE_PATH = '/copiloto'

function conversationRowKey(conv: WaCopilotoConversation): string {
  if (conv.pending_contact && conv.contact_id) {
    return `ct-${conv.contact_id}`
  }
  return String(conv.id)
}

/** Evita peticiones duplicadas en paralelo (varios watchers / init / select). */
const inflight = {
  session: null as Promise<void> | null,
  templates: null as Promise<void> | null,
  assignable: null as Promise<void> | null,
  conversationsKey: '' as string,
  conversations: null as Promise<void> | null,
  messages: new Map<number, Promise<void>>()
}

/** Cola de selección: evita carreras entre clics rápidos (URL / mensajes desincronizados). */
let selectConversationChain: Promise<void> = Promise.resolve()
let selectConversationInFlight = false

/** PATCH /read agrupado; no dispara recargas de UI. */
const markReadDebounce = new Map<number, ReturnType<typeof setTimeout>>()

/** Insights WS que llegaron antes que el mensaje esté en la lista abierta/caché. */
const pendingInsightsByMessageId = new Map<
  number,
  { convId: number; insights: WaCopilotoMessageInsight[] }
>()

function scheduleMarkReadApi(conversationId: number) {
  const prev = markReadDebounce.get(conversationId)
  if (prev) clearTimeout(prev)
  markReadDebounce.set(
    conversationId,
    setTimeout(() => {
      markReadDebounce.delete(conversationId)
      WaCopilotoService.markRead(conversationId).catch(() => {})
    }, 400)
  )
}

function clearMarkReadDebounce() {
  for (const t of markReadDebounce.values()) clearTimeout(t)
  markReadDebounce.clear()
}

export type WaCopilotoInboxMode = 'default' | 'copiloto-jefe' | 'copiloto-advisor'

export function useWaCopilotoInbox(options?: {
  copilotoQueue?: WaCopilotoInboxMode
  routeScope?: CopilotoRouteScope
  /** Si false, la selección no cambia la URL. */
  syncRoute?: boolean
}) {
  const copilotoQueue = options?.copilotoQueue ?? 'default'
  const routeScope: CopilotoRouteScope = options?.routeScope
    ?? (copilotoQueue === 'copiloto-jefe' ? 'equipo' : 'advisor')
  const routeBase = copilotoQueue === 'default'
    ? WA_COPILOTO_BASE_PATH
    : copilotoBasePath(routeScope)
  const syncRoute = options?.syncRoute ?? copilotoQueue === 'default'
  const route = useRoute()
  const router = useRouter()
  const { withSpinner } = useSpinner()
  const { showError, showSuccess } = useModal()
  const { currentId } = useUserRole()
  const cache = useWaCopilotoCache()
  const WaCopilotoWs = useWaCopilotoWebSocket()

  const session = ref<WaCopilotoSession | null>(null)
  const allConversations = ref<WaCopilotoConversation[]>([])
  const messages = ref<WaCopilotoMessage[]>([])
  const templates = ref<WaCopilotoTemplate[]>([])
  const assignableUsers = ref<WaCopilotoAssignableUser[]>([])

  const selectedConversationId = ref<number | null>(null)
  const pendingContactSelection = ref<WaCopilotoConversation | null>(null)
  /** En móvil, evita reabrir el primer chat al volver a la lista. */
  const suppressAutoSelect = ref(false)
  /** Conversación a la que corresponde `messages` (evita mostrar otro chat tras cargas en paralelo). */
  const messagesConversationId = ref<number | null>(null)
  const search = ref('')
  const filter = ref<WaCopilotoFilter>(copilotoQueue === 'copiloto-advisor' ? 'mis' : 'todas')
  const soloClienteInbound = ref(copilotoQueue !== 'default')
  const includeContactsInList = ref(copilotoQueue === 'default')
  const assignedUserFilter = ref<number | null>(null)

  function conversationListParams(page: number, append = false) {
    const params: {
      filter?: WaCopilotoFilter
      search?: string
      per_page: number
      page: number
      solo_cliente_inbound?: number
      include_contacts?: number
      assigned_user_id?: number
    } = {
      filter: filter.value,
      search: search.value.trim() || undefined,
      per_page: CONVERSATIONS_PER_PAGE,
      page
    }
    if (soloClienteInbound.value) params.solo_cliente_inbound = 1
    if (!includeContactsInList.value) params.include_contacts = 0
    if (assignedUserFilter.value && assignedUserFilter.value > 0) {
      params.assigned_user_id = assignedUserFilter.value
    }
    return params
  }

  function setAssignedUserFilter(userId: number | null) {
    assignedUserFilter.value = userId && userId > 0 ? userId : null
    void loadConversations({ page: 1, force: true })
  }
  const sendingMessage = ref(false)
  const loadingConversations = ref(false)
  const loadingMessages = ref(false)
  const loadingTemplates = ref(false)
  const refreshing = ref(false)
  const savingNewContact = ref(false)
  const loadingMoreConversations = ref(false)
  const error = ref<string | null>(null)
  const insightsFichaByPhone = waCopilotoInsightsFichaByPhone

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

  const selectedConversation = computed(() => {
    if (selectedConversationId.value) {
      return allConversations.value.find((c) => c.id === selectedConversationId.value)
        ?? conversations.value.find((c) => c.id === selectedConversationId.value)
        ?? null
    }
    return pendingContactSelection.value
  })

  /** Mensajes solo si pertenecen a la conversación abierta (evita mezclar chats al cambiar de lead). */
  const openMessagesForSelection = computed(() => {
    const convId = selectedConversationId.value
    if (!convId || messagesConversationId.value !== convId) {
      return [] as WaCopilotoMessage[]
    }
    return messages.value
  })

  const isChatHydrating = computed(() => {
    const convId = selectedConversationId.value
    if (!convId) return false
    return loadingMessages.value || messagesConversationId.value !== convId
  })

  const unreadTotal = computed(() =>
    allConversations.value.reduce((sum, c) => sum + (c.unread_count || 0), 0)
  )

  function hydrateFromCache() {
    const cachedSession = cache.getSession()
    if (cachedSession) session.value = cachedSession

    const cachedTemplates = cache.getTemplates(session.value?.slug)
    if (cachedTemplates) templates.value = cachedTemplates

    const cachedAssignable = cache.getAssignable()
    if (cachedAssignable) assignableUsers.value = cachedAssignable

    const cachedConvs = cache.getAllConversations() ?? cache.getConversationsSnapshot()
    if (cachedConvs.length > 0) {
      allConversations.value = [...cachedConvs]
      ensureSelectedConversation()
    }
  }

  function sortConversationsList(list: WaCopilotoConversation[]) {
    return [...list].sort((a, b) => {
      const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
      const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
      if (tb !== ta) return tb - ta
      const keyA = a.pending_contact && a.contact_id ? a.contact_id : a.id
      const keyB = b.pending_contact && b.contact_id ? b.contact_id : b.id
      return keyB - keyA
    })
  }

  function selectPendingContact(conv: WaCopilotoConversation | null) {
    selectedConversationId.value = null
    pendingContactSelection.value = conv
    messages.value = []
    messagesConversationId.value = null
    suppressAutoSelect.value = true
  }

  function upsertConversation(conv: WaCopilotoConversation) {
    const key = conversationRowKey(conv)
    const idx = allConversations.value.findIndex((c) => conversationRowKey(c) === key)
    if (idx >= 0) {
      allConversations.value[idx] = { ...allConversations.value[idx], ...conv }
    } else {
      allConversations.value = [conv, ...allConversations.value]
    }
    allConversations.value = sortConversationsList(allConversations.value)
    cache.setAllConversations(allConversations.value)
  }

  function syncConversationsFromStore() {
    const snap = cache.getConversationsSnapshot()
    if (snap.length > 0) {
      allConversations.value = [...snap]
    }
  }

  function syncOpenMessagesFromStore(convId: number) {
    if (selectedConversationId.value !== convId) return
    const entry = cache.getMessagesEntry(convId)
    if (!entry?.messages?.length) return
    messages.value = [...entry.messages]
    messagesConversationId.value = convId
  }

  function findMessageIndex(list: WaCopilotoMessage[], messageId: unknown): number {
    const id = waMessageNumericId(messageId)
    if (!id) return -1
    return list.findIndex((m) => waMessageNumericId(m.id) === id)
  }

  function withPendingInsights(msg: WaCopilotoMessage, convId: number): WaCopilotoMessage {
    const msgId = waMessageNumericId(msg.id)
    if (!msgId) return msg
    const pending = pendingInsightsByMessageId.get(msgId)
    if (!pending || pending.convId !== convId || !pending.insights.length) return msg
    pendingInsightsByMessageId.delete(msgId)
    return { ...msg, insights: [...pending.insights] }
  }

  function applyInsightsToMessageList(
    list: WaCopilotoMessage[],
    msgId: number,
    insights: WaCopilotoMessageInsight[]
  ): { list: WaCopilotoMessage[]; applied: boolean } {
    const idx = findMessageIndex(list, msgId)
    if (idx < 0) return { list, applied: false }
    const next = [...list]
    next[idx] = { ...next[idx], insights: [...insights] }
    return { list: next, applied: true }
  }

  function flushPendingInsightsForConversation(convId: number, list: WaCopilotoMessage[]): WaCopilotoMessage[] {
    let next = [...list]
    let changed = false
    for (const [msgId, pending] of pendingInsightsByMessageId.entries()) {
      if (pending.convId !== convId) continue
      const result = applyInsightsToMessageList(next, msgId, pending.insights)
      if (result.applied) {
        next = result.list
        pendingInsightsByMessageId.delete(msgId)
        changed = true
      }
    }
    return changed ? next : list
  }

  function syncMessagesCacheForConversation(convId: number) {
    const cached = cache.getMessagesEntry(convId)
    cache.setMessages(convId, messages.value, cached?.conversationPatch, {
      fullHistory: cached?.fullHistory !== false
    })
  }

  function upsertMessageInConversation(convId: number, msg: WaCopilotoMessage) {
    const msgId = waMessageNumericId(msg.id)
    if (!msgId) return

    if (selectedConversationId.value === convId) {
      const idx = findMessageIndex(messages.value, msgId)
      const next = [...messages.value]
      if (idx >= 0) {
        next[idx] = withPendingInsights(
          mergeWaCopilotoMessage(next[idx], { ...msg, id: msgId }),
          convId
        )
      } else {
        next.push(withPendingInsights({ ...msg, id: msgId }, convId))
      }
      messages.value = flushPendingInsightsForConversation(convId, next)
      messagesConversationId.value = convId
      syncMessagesCacheForConversation(convId)
    } else {
      const cached = cache.getMessages(convId)
      if (cached) {
        const mi = findMessageIndex(cached.messages, msgId)
        const list = [...cached.messages]
        if (mi >= 0) {
          list[mi] = withPendingInsights(
            mergeWaCopilotoMessage(list[mi], { ...msg, id: msgId }),
            convId
          )
        } else {
          list.push(withPendingInsights({ ...msg, id: msgId }, convId))
        }
        const flushed = flushPendingInsightsForConversation(convId, list)
        cache.setMessages(convId, flushed, cached.conversationPatch, {
          fullHistory: cached?.fullHistory !== false
        })
      } else {
        cache.setMessages(convId, [{ ...msg, id: msgId }], undefined, {
          fullHistory: false
        })
      }
    }
  }

  function applyRealtimeMessage(payload: WaCopilotoWsMessageCreatedPayload) {
    const convId = Number(payload.conversation_id)
    if (!convId) return

    WaCopilotoLog('ui.messageCreated', {
      convId,
      selected: selectedConversationId.value,
      messagesConv: messagesConversationId.value,
      direction: payload.message?.direction
    })

    // La caché ya tiene unread/preview correctos (applyMessageCreatedToStore); no pisar con payload.conversation crudo.
    syncConversationsFromStore()

    const msg = payload.message
    if (!waMessageNumericId(msg?.id)) return

    if (
      selectedConversationId.value === convId
      && messagesConversationId.value !== convId
    ) {
      hydrateMessagesFromCache(convId)
    }

    upsertMessageInConversation(convId, msg as WaCopilotoMessage)

    if (msg?.direction === 'in') {
      const inboundId = waMessageNumericId(msg.id)
      if (inboundId) {
        markWaCopilotoAnalysisPending(convId, inboundId)
      }
    }

    if (selectedConversationId.value === convId && msg?.direction === 'in') {
      markConversationRead(convId, { forceServer: true })
    }

    WaCopilotoLog('ui.messageCreated.done', {
      convId,
      listLen: allConversations.value.length,
      openMessages: messages.value.length
    })
  }

  function applyRealtimeStatus(payload: WaCopilotoWsMessageStatusPayload) {
    const convId = Number(payload.conversation_id)
    const messageId = waMessageNumericId(payload.message_id)
    if (!convId || !messageId) return

    const incomingStatus = resolveWaCopilotoDeliveryStatus(payload)
    if (!incomingStatus) return

    WaCopilotoLog('ui.statusUpdated', {
      convId,
      messageId,
      status: incomingStatus,
      selected: selectedConversationId.value
    })

    patchConversationLastMessageStatus(convId, messageId, incomingStatus)
    syncConversationsFromStore()

    if (selectedConversationId.value === convId) {
      if (messagesConversationId.value === convId) {
        const idx = findMessageIndex(messages.value, messageId)
        if (idx >= 0) {
          const list = [...messages.value]
          list[idx] = mergeWaCopilotoStatusIntoMessage(list[idx], payload, incomingStatus)
          messages.value = list
          syncMessagesCacheForConversation(convId)
        } else {
          syncOpenMessagesFromStore(convId)
        }
      } else {
        syncOpenMessagesFromStore(convId)
      }
      const merged = messages.value.find((m) => waMessageNumericId(m.id) === messageId)
      if (merged?.delivery_status === 'failed') {
        showError(
          'No llegó a WhatsApp',
          merged.failed_reason || 'Meta rechazó la entrega. Revisa tamaño o formato del archivo.'
        )
      }
    }
  }

  function getRouteConversationSlug(): string | null {
    if (copilotoQueue !== 'default') {
      return copilotoRouteConversationSlug(route)
    }
    const p = route.params.conversation
    if (!p) return null
    const raw = Array.isArray(p) ? p[0] : String(p)
    return raw?.trim() ? raw.trim() : null
  }

  function normalizeConversationId(id: unknown): number | null {
    const n = Number(id)
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null
  }

  function isRouteOnConversation(convId: number): boolean {
    const slug = getRouteConversationSlug()
    if (!slug) return false
    const parsed = parseWaCopilotoConversationSlug(slug)
    if (!parsed) return false
    if (parsed.kind === 'id') return parsed.id === convId
    const conv = allConversations.value.find((c) => c.id === convId)
    return Boolean(conv?.phone_e164 === parsed.phoneE164)
  }

  async function navigateToConversation(convId: number) {
    const target = copilotoQueue === 'default'
      ? waCopilotoConversationPath(convId)
      : copilotoConversationPath(routeScope, convId)
    const slug = String(convId)
    if (route.path === target && getRouteConversationSlug() === slug) {
      WaCopilotoLog('navigate.skip', { convId, target })
      return
    }
    try {
      await router.replace(target)
      await nextTick()
      WaCopilotoLog('navigate.ok', {
        convId,
        target,
        path: route.path,
        slug: getRouteConversationSlug()
      })
    } catch (err) {
      try {
        await navigateTo(target, { replace: true })
        await nextTick()
        WaCopilotoLog('navigate.ok.fallback', { convId, target, path: route.path })
      } catch (fallbackErr) {
        waCopilotoWarn('navigate.failed', {
          convId,
          target,
          err: String(err),
          fallback: String(fallbackErr)
        })
      }
    }
  }

  function conversationIdFromSlug(slug: string): number | null {
    if (copilotoQueue !== 'default') {
      return copilotoConversationIdFromSlug(slug, allConversations.value)
    }
    const parsed = parseWaCopilotoConversationSlug(slug)
    if (!parsed) return null
    if (parsed.kind === 'id') return parsed.id
    const byPhone = findConversationInList(allConversations.value, parsed)
    if (byPhone) return byPhone.id
    const digits = slug.replace(/\D+/g, '')
    const asId = parseInt(digits, 10)
    if (asId > 0) {
      const byId = allConversations.value.find((c) => c.id === asId)
      if (byId) return byId.id
    }
    return null
  }

  function isMessagesHydrated(conversationId: number, candidate: WaCopilotoMessage[]) {
    if (selectedConversationId.value !== conversationId) return false
    if (messagesConversationId.value !== conversationId) return false
    if (messages.value.length !== candidate.length) return false
    if (candidate.length === 0) return true
    const curLast = messages.value[messages.value.length - 1]
    const candLast = candidate[candidate.length - 1]
    return waMessageNumericId(curLast?.id) === waMessageNumericId(candLast?.id)
  }

  function applyMessagesForConversation(conversationId: number, list: WaCopilotoMessage[]) {
    if (selectedConversationId.value !== conversationId) return
    if (isMessagesHydrated(conversationId, list)) {
      messagesConversationId.value = conversationId
      return
    }
    messages.value = list
    messagesConversationId.value = conversationId
    syncWaCopilotoPendingAnalysisForMessages(conversationId, list)
  }

  function hydrateMessagesFromCache(conversationId: number) {
    const entry = cache.getMessagesEntry(conversationId)
    const cachedMsgs = entry?.messages
    if (
      entry
      && entry.fullHistory !== false
      && Array.isArray(cachedMsgs)
      && cachedMsgs.length > 0
    ) {
      applyMessagesForConversation(conversationId, cachedMsgs)
      return
    }
  }

  function isCopilotoPipelineRoute() {
    return copilotoQueue !== 'default' && route.path.endsWith('/pipeline')
  }

  function shouldAutoPickFirstConversation() {
    if (getRouteConversationSlug()) return false
    if (isCopilotoPipelineRoute()) return false
    if (suppressAutoSelect.value) return false
    if (import.meta.client && window.innerWidth < 1024) return false
    return true
  }

  function ensureSelectedConversation() {
    if (getRouteConversationSlug()) {
      suppressAutoSelect.value = false
      return
    }

    if (isCopilotoPipelineRoute()) {
      return
    }

    const list = conversations.value
    if (!list.length) {
      selectedConversationId.value = null
      messages.value = []
      messagesConversationId.value = null
      return
    }

    const currentId = selectedConversationId.value
    const currentValid = currentId != null && list.some((c) => c.id === currentId)

    if (currentValid) return

    if (shouldAutoPickFirstConversation()) {
      selectedConversationId.value = list[0].id
      return
    }

    selectedConversationId.value = null
    messages.value = []
    messagesConversationId.value = null
  }

  async function clearConversationSelection() {
    suppressAutoSelect.value = true
    selectedConversationId.value = null
    messages.value = []
    messagesConversationId.value = null
    setWaCopilotoViewingConversationId(null)

    if (!getRouteConversationSlug()) return

    const listPath = copilotoQueue === 'default' ? WA_COPILOTO_BASE_PATH : copilotoListPath(routeScope)
    try {
      await router.replace(listPath)
      await nextTick()
    } catch {
      await navigateTo(listPath, { replace: true })
    }
  }

  let resolveRouteChain: Promise<void> = Promise.resolve()

  async function resolveRouteConversation(explicitSlug?: string) {
    const slug = explicitSlug ?? getRouteConversationSlug()
    if (!slug) return

    const parsed = parseWaCopilotoConversationSlug(slug)
    if (!parsed) {
      showError('Enlace no válido', 'No se reconoce este chat.')
      await router.replace(copilotoQueue === 'default' ? WA_COPILOTO_BASE_PATH : copilotoListPath(routeScope))
      return
    }

    const run = async () => {
      let conv = findConversationInList(allConversations.value, parsed)

      if (!conv && parsed.kind === 'id') {
        try {
          const res = await WaCopilotoService.getMessages(parsed.id, { per_page: 1 })
          if (res?.conversation) {
            conv = res.conversation as WaCopilotoConversation
            upsertConversation(conv)
          }
        } catch {
          conv = undefined
        }
      }

      if (!conv && parsed.kind === 'phone') {
        try {
          const res = await WaCopilotoService.getConversations({
            filter: filter.value,
            search: parsed.phoneE164,
            per_page: 20,
            page: 1
          })
          const rows = Array.isArray(res?.data) ? res.data : []
          conv = rows.find((c: WaCopilotoConversation) => c.phone_e164 === parsed.phoneE164)
          if (conv) upsertConversation(conv)
        } catch {
          conv = undefined
        }
      }

      if (!conv) {
        showError('Chat no encontrado', 'Este número o conversación no está en el inbox.')
        selectedConversationId.value = null
        messages.value = []
        messagesConversationId.value = null
        await router.replace(copilotoQueue === 'default' ? WA_COPILOTO_BASE_PATH : copilotoListPath(routeScope))
        return
      }

      const canonicalPath = copilotoQueue === 'default'
        ? waCopilotoConversationPath(conv.id)
        : copilotoConversationPath(routeScope, conv.id)
      const needsCanonicalUrl =
        parsed.kind === 'phone' || slug !== String(conv.id)

      if (selectedConversationId.value !== conv.id) {
        await selectConversation(conv.id, { skipRoute: true })
      } else if (messagesConversationId.value !== conv.id) {
        await loadMessages(conv.id)
      }

      if (needsCanonicalUrl && route.path !== canonicalPath) {
        await router.replace(canonicalPath)
      }
    }

    resolveRouteChain = resolveRouteChain.then(run, run)
    await resolveRouteChain
  }

  async function syncConversationFromRoute() {
    const slug = getRouteConversationSlug()
    if (slug) {
      await resolveRouteConversation(slug)
      return
    }
    ensureSelectedConversation()
  }

  /**
   * Actualiza badge local y sincroniza servidor solo si hace falta.
   * forceServer: mensaje entrante con chat abierto (servidor puede tener unread > 0).
   */
  function markConversationRead(
    conversationId: number,
    options: { forceServer?: boolean } = {}
  ) {
    const idx = allConversations.value.findIndex((x) => x.id === conversationId)
    const hadUnread = idx >= 0 && (allConversations.value[idx].unread_count || 0) > 0

    if (hadUnread && idx >= 0) {
      allConversations.value[idx] = {
        ...allConversations.value[idx],
        unread_count: 0
      }
      cache.patchConversation(conversationId, { unread_count: 0 })
    }

    if (!options.forceServer && !hadUnread) return

    scheduleMarkReadApi(conversationId)
  }

  async function loadSession(options: { background?: boolean; force?: boolean } = {}) {
    const cached = !options.force ? cache.getSession() : null
    if (cached) {
      session.value = cached
      if (!options.force) return
    }

    if (inflight.session && !options.force) {
      await inflight.session
      return
    }

    const run = async () => {
      const res = await WaCopilotoService.getSession()
      session.value = res?.data ?? null
      cache.setSession(session.value)
    }

    inflight.session = run().then(() => undefined).finally(() => {
      inflight.session = null
    })
    await inflight.session
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
        if (!options.force) return
      }
    }

    const convKey = `${filter.value}|${search.value.trim()}|${page}|${append ? 1 : 0}|${soloClienteInbound.value ? 1 : 0}|${includeContactsInList.value ? 1 : 0}|${assignedUserFilter.value ?? 0}`
    if (inflight.conversations && inflight.conversationsKey === convKey && !options.force) {
      await inflight.conversations
      return
    }

    if (append) {
      loadingMoreConversations.value = true
    } else if (!options.background) {
      loadingConversations.value = true
    } else {
      refreshing.value = true
    }
    error.value = null

    const fetchConversations = async () => {
      try {
        const res = await WaCopilotoService.getConversations(conversationListParams(page, append))
        const rows = Array.isArray(res?.data) ? res.data : []
        if (append) {
          const seen = new Set(allConversations.value.map((c) => conversationRowKey(c)))
          const merged = [...allConversations.value]
          for (const row of rows) {
            const key = conversationRowKey(row)
            if (!seen.has(key)) merged.push(row)
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

    inflight.conversationsKey = convKey
    inflight.conversations = fetchConversations().finally(() => {
      if (inflight.conversationsKey === convKey) {
        inflight.conversations = null
        inflight.conversationsKey = ''
      }
    })
    await inflight.conversations
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

  async function loadMessages(
    conversationId: number,
    options: { background?: boolean; force?: boolean } = {}
  ) {
    const pending = inflight.messages.get(conversationId)
    if (pending && !options.force) {
      await pending
      if (selectedConversationId.value === conversationId && messagesConversationId.value !== conversationId) {
        hydrateMessagesFromCache(conversationId)
      }
      return
    }

    const run = async () => {
      const cachedEntry = !options.force ? cache.getMessages(conversationId) : null
      const hasFullHistoryCache =
        Boolean(cachedEntry && cachedEntry.fullHistory !== false)

      if (hasFullHistoryCache && cachedEntry) {
        const localList =
          selectedConversationId.value === conversationId
          && messagesConversationId.value === conversationId
            ? messages.value
            : []
        const mergedCached = mergeMessageLists(cachedEntry.messages ?? [], localList)
        const hadUnread =
          (allConversations.value.find((c) => c.id === conversationId)?.unread_count || 0) > 0
        applyMessagesForConversation(
          conversationId,
          flushPendingInsightsForConversation(conversationId, mergedCached)
        )
        if (cachedEntry.conversationPatch) {
          cache.patchConversation(conversationId, cachedEntry.conversationPatch)
          const idx = allConversations.value.findIndex((c) => c.id === conversationId)
          if (idx >= 0) {
            allConversations.value[idx] = {
              ...allConversations.value[idx],
              ...cachedEntry.conversationPatch
            }
          }
        }
        if (selectedConversationId.value === conversationId) {
          markConversationRead(conversationId, { forceServer: hadUnread })
        }
        if (!options.force) return
      }

      const stillSelected = () => selectedConversationId.value === conversationId
      if (stillSelected()) {
        loadingMessages.value = true
      }
      try {
        const res = await WaCopilotoService.getMessages(conversationId, { per_page: 200 })
        const rows = Array.isArray(res?.data) ? res.data : []
        const convPatch = res?.conversation as Partial<WaCopilotoConversation> | undefined
        const cachedList = cache.getMessages(conversationId)?.messages ?? []
        const localList =
          selectedConversationId.value === conversationId
          && messagesConversationId.value === conversationId
            ? messages.value
            : []
        const merged = mergeMessageLists(rows, cachedList, localList)
        const hadUnread =
          (allConversations.value.find((c) => c.id === conversationId)?.unread_count || 0) > 0
        cache.setMessages(conversationId, merged, convPatch, { fullHistory: true })
        const withPending = flushPendingInsightsForConversation(conversationId, merged)
        applyMessagesForConversation(conversationId, withPending)
        if (convPatch) {
          cache.patchConversation(conversationId, convPatch)
          const idx = allConversations.value.findIndex((c) => c.id === conversationId)
          if (idx >= 0) {
            allConversations.value[idx] = { ...allConversations.value[idx], ...convPatch }
          }
        }
        if (stillSelected()) {
          markConversationRead(conversationId, { forceServer: hadUnread })
        }
      } catch (e: any) {
        if (!hasFullHistoryCache && stillSelected()) {
          showError('Error', e?.message || 'No se pudo cargar mensajes')
          messages.value = []
          messagesConversationId.value = null
        }
      } finally {
        loadingMessages.value = false
        syncConversationsFromStore()
      }
    }

    const task = run().finally(() => {
      inflight.messages.delete(conversationId)
    })
    inflight.messages.set(conversationId, task)
    await task
  }

  async function applyConversationSelection(
    convId: number,
    options: { forceMessages?: boolean } = {}
  ) {
    const prevId = selectedConversationId.value
    const switched = prevId !== convId

    syncConversationsFromStore()
    if (switched && messagesConversationId.value !== convId) {
      loadingMessages.value = true
    }
    selectedConversationId.value = convId
    setWaCopilotoViewingConversationId(convId)
    hydrateMessagesFromCache(convId)

    WaCopilotoLog('loadMessages.start', {
      convId,
      messagesConv: messagesConversationId.value,
      force: options.forceMessages
    })

    await loadMessages(convId, {
      force: options.forceMessages ?? (switched || messagesConversationId.value !== convId)
    })

    WaCopilotoLog('loadMessages.done', {
      convId,
      count: messages.value.length,
      messagesConv: messagesConversationId.value
    })

    syncConversationsFromStore()
    syncOpenMessagesFromStore(convId)
  }

  async function runSelectConversation(
    convId: number,
    options: { skipRoute?: boolean }
  ) {
    const prevId = selectedConversationId.value

    WaCopilotoLog('selectConversation.run', {
      id: convId,
      from: prevId,
      skipRoute: options.skipRoute
    })

    selectConversationInFlight = true
    suppressAutoSelect.value = false
    try {
      await applyConversationSelection(convId)
      if (syncRoute && !options.skipRoute && !isRouteOnConversation(convId)) {
        await navigateToConversation(convId)
      }
    } finally {
      selectConversationInFlight = false
    }
  }

  async function selectConversation(id: number, options: { skipRoute?: boolean } = {}) {
    const convId = normalizeConversationId(id)
    if (!convId) return

    WaCopilotoLog('selectConversation.enqueue', {
      id: convId,
      from: selectedConversationId.value,
      skipRoute: options.skipRoute
    })

    const run = () => runSelectConversation(convId, options)
    selectConversationChain = selectConversationChain.then(run, run)
    await selectConversationChain
  }

  function patchConversationLastMessageStatus(
    convId: number,
    messageId: number,
    status: string
  ) {
    const idx = allConversations.value.findIndex((c) => c.id === convId)
    if (idx < 0) return
    const conv = allConversations.value[idx]
    if (conv.last_direction !== 'out' || conv.last_message_id !== messageId) return
    const patch = { last_message_delivery_status: status }
    allConversations.value[idx] = { ...conv, ...patch }
    cache.patchConversation(convId, patch)
  }

  function patchConversationAfterOutbound(
    conv: WaCopilotoConversation,
    preview: string,
    msg?: WaCopilotoMessage
  ) {
    const sentAt = msg?.sent_at ?? new Date().toISOString()
    const patch = msg
      ? conversationPatchFromWaInboxMessage(msg)
      : {
          last_message_preview: preview.slice(0, 200),
          last_message_at: sentAt,
          last_direction: 'out' as const,
          last_message_type: 'text',
          last_message_delivery_status: 'pending',
          last_message_time_label: formatDatePe(sentAt) || ''
        }
    upsertConversation({
      ...conv,
      ...patch,
      last_message_time_label:
        patch.last_message_time_label
        || formatDatePe(sentAt)
        || msg?.time_label
        || conv.last_message_time_label
        || ''
    })
  }

  async function sendComposerMessage(payload: WaCopilotoComposerSendPayload) {
    const conv = selectedConversation.value
    if (!conv) return
    if (!conv.can_send_text) {
      showError('Ventana cerrada', 'Solo puedes enviar plantillas mientras la ventana esté cerrada.')
      return
    }

    const files = payload.files?.length
      ? payload.files
      : payload.file
        ? [payload.file]
        : []
    const text = payload.text.trim()
    if (!text && !files.length) return

    sendingMessage.value = true
    try {
      await dispatchWaInboxComposerSends(payload, async (item) => {
        const res = await WaCopilotoService.sendMessage(conv.id, {
          message: item.text || undefined,
          file: item.file,
          mediaKind: item.mediaKind,
          replyToMetaMessageId: item.replyToMetaMessageId
        })
        const msg = res?.data as WaCopilotoMessage | undefined
        if (waMessageNumericId(msg?.id)) {
          const outbound: WaCopilotoMessage = {
            ...msg!,
            delivery_status: msg!.delivery_status ?? 'pending'
          }
          upsertMessageInConversation(conv.id, outbound)
          const preview = item.text || msg!.body || `[${msg!.message_type || 'archivo'}]`
          patchConversationAfterOutbound(conv, preview, outbound)
        }
      })
    } catch (e: any) {
      showError('Error', e?.message || 'No se pudo enviar el mensaje')
      throw e
    } finally {
      sendingMessage.value = false
    }
  }

  const schedulingMessage = ref(false)

  async function scheduleComposerMessage(payload: { text: string; scheduledAt: string }) {
    const conv = selectedConversation.value
    if (!conv) return
    if (!conv.can_send_text) {
      showError('Ventana cerrada', 'Solo puedes enviar plantillas mientras la ventana esté cerrada.')
      return
    }

    const text = payload.text.trim()
    if (!text) return

    const scheduledAt = payload.scheduledAt
    const scheduledDate = new Date(scheduledAt)
    if (Number.isNaN(scheduledDate.getTime())) {
      showError('Fecha inválida', 'Indica una fecha y hora válidas.')
      return
    }

    if (scheduledDate.getTime() <= Date.now()) {
      showError('Fecha inválida', 'La fecha debe ser en el futuro.')
      return
    }

    const expiresRaw = conv.window_expires_at
    if (expiresRaw) {
      const expires = new Date(expiresRaw)
      if (!Number.isNaN(expires.getTime()) && scheduledDate.getTime() >= expires.getTime()) {
        showError(
          'Fuera de la ventana',
          'Ese horario queda fuera de la ventana de 24 h. Programa antes del cierre o usa una plantilla.'
        )
        return
      }
    }

    schedulingMessage.value = true
    try {
      const res = await WaCopilotoService.scheduleMessage(conv.id, {
        message: text,
        scheduledAt
      })
      if (res?.success === false) {
        throw new Error(res?.message || 'No se pudo programar el mensaje')
      }
      showSuccess('Mensaje programado', 'Se enviará en el horario indicado.')
    } catch (e: any) {
      showError('Error', e?.message || 'No se pudo programar el mensaje')
      throw e
    } finally {
      schedulingMessage.value = false
    }
  }

  const sendingTemplate = ref(false)

  async function ensureConversationForTemplate(): Promise<WaCopilotoConversation | null> {
    let conv = selectedConversation.value
    if (!conv) return null

    if (!conv.pending_contact || !conv.contact_id) {
      return conv.id > 0 ? conv : null
    }

    const contactId = conv.contact_id
    const res = await WaCopilotoService.openContactConversation(contactId)
    if (res?.success === false || !res?.data?.id) {
      throw new Error(res?.message || 'No se pudo abrir la conversación de ventas')
    }

    cache.invalidateAll()
    await loadAllConversations({ force: true })
    await selectConversation(Number(res.data.id), { forceMessages: true })
    pendingContactSelection.value = null
    conv = selectedConversation.value
    return conv?.id ? conv : null
  }

  async function sendTemplateMessage(
    templateName: string,
    params: Record<string, string>,
    files: Record<string, File> = {},
    fileKinds: Record<string, string> = {}
  ) {
    sendingTemplate.value = true
    try {
      const conv = await ensureConversationForTemplate()
      if (!conv?.id) return

      const res = await WaCopilotoService.sendTemplate(conv.id, {
        template_name: templateName,
        params,
        files,
        fileKinds
      }) as { success?: boolean; message?: string; data?: WaCopilotoMessage }

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

      upsertMessageInConversation(conv.id, msg)
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
      const res = await WaCopilotoService.assign(conv.id, userId)
      if (res?.data) {
        const idx = allConversations.value.findIndex((c) => c.id === conv.id)
        if (idx >= 0) {
          allConversations.value[idx] = res.data
          cache.patchConversation(conv.id, res.data)
        }
      }
    }, 'Asignando…')
  }

  const savingRename = ref(false)

  async function renameConversation(contactName: string) {
    const conv = selectedConversation.value
    if (!conv) return

    const name = contactName.trim()
    if (!name) {
      showError('Nombre requerido', 'Escribe un nombre para el contacto.')
      return
    }

    savingRename.value = true
    try {
      await withSpinner(async () => {
        const res = await WaCopilotoService.renameContact(conv.id, name)
        if (!res?.success) {
          throw new Error(res?.message || 'No se pudo actualizar el nombre')
        }
        if (res?.data) {
          upsertConversation(res.data as WaCopilotoConversation)
          syncConversationsFromStore()
        }
        showSuccess('Nombre actualizado', 'Se verá en la lista y en el chat abierto.')
      }, 'Guardando…')
    } catch (e: any) {
      showError('Error', e?.message || 'No se pudo actualizar el nombre')
      throw e
    } finally {
      savingRename.value = false
    }
  }

  async function createManualContact(payload: {
    contact_name: string
    phone: string
    assigned_user_id?: number | null
  }) {
    savingNewContact.value = true
    try {
      await withSpinner(async () => {
        const res = await WaCopilotoService.createConversation(payload)
        if (!res?.success || !res?.data) {
          throw new Error(res?.message || 'No se pudo registrar el contacto')
        }

        const conv = res.data as WaCopilotoConversation
        upsertConversation(conv)
        selectedConversationId.value = conv.id
        messages.value = []
        messagesConversationId.value = conv.id
        cache.setMessages(conv.id, [], conv)
        await router.replace(waCopilotoConversationPath(conv.id))
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
    const sessionSlug = session.value?.slug
    const cached = !options.force ? cache.getTemplates(sessionSlug) : null
    if (cached?.length) {
      templates.value = cached
      if (!options.force) return
    }

    if (inflight.templates && !options.force) {
      await inflight.templates
      return
    }

    if (!options.background) {
      loadingTemplates.value = true
    }

    const run = async () => {
      try {
        const res = await WaCopilotoService.getTemplates(
          sessionSlug ? { session_slug: sessionSlug } : {}
        )
        templates.value = Array.isArray(res?.data) ? res.data : []
        cache.setTemplates(templates.value, sessionSlug)
      } catch {
        if (!cached?.length) {
          templates.value = []
        }
      } finally {
        loadingTemplates.value = false
      }
    }

    inflight.templates = run().then(() => undefined).finally(() => {
      inflight.templates = null
    })
    await inflight.templates
  }

  async function loadAssignableUsers(options: { background?: boolean; force?: boolean } = {}) {
    const cached = !options.force ? cache.getAssignable() : null
    if (cached) {
      assignableUsers.value = cached
      if (!options.force) return
    }

    if (inflight.assignable && !options.force) {
      await inflight.assignable
      return
    }

    const run = async () => {
      const res = await WaCopilotoService.getAssignableUsers()
      assignableUsers.value = Array.isArray(res?.data) ? res.data : []
      cache.setAssignable(assignableUsers.value)
    }

    inflight.assignable = run().then(() => undefined).finally(() => {
      inflight.assignable = null
    })
    await inflight.assignable
  }

  function applyRealtimeInsights(payload: WaCopilotoWsMessageInsightsPayload) {
    const convId = Number(payload.conversation_id)
    const msgId = waMessageNumericId(payload.message_id)
    if (!convId || !msgId || !Array.isArray(payload.insights)) return

    const insights = [...payload.insights] as WaCopilotoMessageInsight[]

    WaCopilotoLog('ui.messageInsights', {
      convId,
      msgId,
      count: insights.length,
      selected: selectedConversationId.value
    })

    let applied = false

    if (selectedConversationId.value === convId && messagesConversationId.value === convId) {
      const result = applyInsightsToMessageList(messages.value, msgId, insights)
      if (result.applied) {
        messages.value = result.list
        applied = true
        syncMessagesCacheForConversation(convId)
      }
    }

    if (!applied) {
      const cached = cache.getMessages(convId)
      if (cached?.messages?.length) {
        const result = applyInsightsToMessageList(cached.messages, msgId, insights)
        if (result.applied) {
          cache.setMessages(convId, result.list, cached.conversationPatch, {
            fullHistory: cached.fullHistory !== false
          })
          applied = true
          if (selectedConversationId.value === convId) {
            syncOpenMessagesFromStore(convId)
          }
        }
      }
    }

    if (applied) {
      pendingInsightsByMessageId.delete(msgId)
      clearWaCopilotoAnalysisPending(msgId)
    } else {
      pendingInsightsByMessageId.set(msgId, { convId, insights })
      WaCopilotoTrace('insights.pending', { convId, msgId })
    }

    const phone = String(payload.phone_e164 || '').trim()
    if (phone && payload.ficha) {
      insightsFichaByPhone.value = {
        ...insightsFichaByPhone.value,
        [phone]: {
          ...(insightsFichaByPhone.value[phone] ?? {}),
          ...payload.ficha
        }
      }
    }

    const leadTemp = payload.temperatura_lead ?? payload.ficha?.temperatura
    if (convId && leadTemp != null && Number.isFinite(Number(leadTemp))) {
      const temp = Math.min(100, Math.max(0, Number(leadTemp)))
      cache.patchConversation(convId, { temperatura: temp })
      const idx = allConversations.value.findIndex((c) => c.id === convId)
      if (idx >= 0) {
        allConversations.value[idx] = { ...allConversations.value[idx], temperatura: temp }
      }
      syncConversationsFromStore()
    }
  }

  const inboxRealtimeHandlers = {
    onMessageCreated: applyRealtimeMessage,
    onMessageStatusUpdated: applyRealtimeStatus,
    onMessageInsightsReady: applyRealtimeInsights
  }

  function connectWebSocket() {
    if (!import.meta.client) return

    ensureWaCopilotoEchoChannel()

    try {
      registerWaCopilotoUiHandlers(inboxRealtimeHandlers)
      bindWaCopilotoLiveHandlers(inboxRealtimeHandlers)
      WaCopilotoWs.connect(inboxRealtimeHandlers)
      WaCopilotoTrace('connect.ok', {
        path: route.path,
        selected: selectedConversationId.value,
        echo: Boolean(getEchoInstance()),
        uiHandlers: Boolean(getWaCopilotoUiHandlers()),
        liveHandlers: Boolean(getWaCopilotoLiveHandlers())
      })
    } catch (err) {
      waCopilotoWarn('connect.handlersFailed', { err: String(err) })
    }
  }

  function disconnectWebSocket() {
    WaCopilotoLog('disconnect', { path: route.path })
    clearMarkReadDebounce()
    setWaCopilotoViewingConversationId(null)
    registerWaCopilotoUiHandlers(null)
    bindWaCopilotoLiveHandlers(null)
    WaCopilotoWs.disconnect()
  }

  function isInboxRoute(path: string) {
    const base = copilotoQueue === 'default' ? WA_COPILOTO_BASE_PATH : routeBase
    return path === base || path.startsWith(`${base}/`)
  }

  watch(selectedConversationId, (id) => {
    setWaCopilotoViewingConversationId(id)
  }, { immediate: true })

  if (import.meta.client) {
    WaCopilotoTrace('inbox.composable.client', { path: route.path })

    exposeWaCopilotoWsDiagnostics(() => ({
      route: route.path,
      selectedConversationId: selectedConversationId.value,
      messagesConversationId: messagesConversationId.value,
      viewing: getWaCopilotoViewingConversationId(),
      echo: Boolean(getEchoInstance()),
      channel: WA_COPILOTO_WS_CHANNEL,
      uiHandlers: Boolean(getWaCopilotoUiHandlers()),
      liveHandlers: Boolean(getWaCopilotoLiveHandlers()),
      conversations: allConversations.value.length,
      openMessages: messages.value.length
    }))

    watch(() => route.path, (path, prev) => {
      WaCopilotoLog('route.change', { from: prev, to: path, inbox: isInboxRoute(path) })
      if (isInboxRoute(path)) {
        connectWebSocket()
      } else {
        disconnectWebSocket()
      }
    })

    onMounted(() => {
      if (isInboxRoute(route.path)) connectWebSocket()
    })

    const g = globalThis as typeof globalThis & { __WaCopilotoEchoReadyBound?: boolean }
    if (!g.__WaCopilotoEchoReadyBound) {
      g.__WaCopilotoEchoReadyBound = true
      window.addEventListener('echo-ready', () => {
        WaCopilotoLog('echo-ready')
        if (isInboxRoute(route.path)) connectWebSocket()
      })
    }
  }

  async function syncContacts() {
    try {
      await WaCopilotoService.syncContacts()
    } catch {
      /* sync best-effort */
    }
  }

  async function openContactConversation(contactId: number) {
    const pending = allConversations.value.find(
      (c) => c.pending_contact && c.contact_id === contactId
    )
    selectPendingContact(pending ?? null)

    try {
      await withSpinner(async () => {
        const res = await WaCopilotoService.openContactConversation(contactId)
        if (res?.success === false || !res?.data?.id) {
          throw new Error(res?.message || 'No se pudo abrir la conversación de ventas')
        }
        cache.invalidateAll()
        await loadAllConversations({ force: true })
        await selectConversation(Number(res.data.id), { forceMessages: true })
      }, 'Abriendo chat de ventas…')
    } catch (e: any) {
      showError('Error', e?.message || 'No se pudo abrir el contacto')
    }
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
        await loadSession()
        await syncContacts()
        await Promise.all([
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

    await syncContacts()
    await Promise.all([
      loadSession({ background: true }),
      loadAllConversations({ background: true }),
      loadTemplates({ background: true }),
      loadAssignableUsers({ background: true })
    ])

    await syncConversationFromRoute()

    // Con slug en URL, selectConversation ya cargó mensajes. Sin slug, solo auto-selección.
    if (selectedConversationId.value && !getRouteConversationSlug()) {
      await loadMessages(selectedConversationId.value)
    }
  }

  async function refreshInbox() {
    cache.invalidateAll()
    await withSpinner(async () => {
      await loadSession()
      await syncContacts()
      await Promise.all([
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

  if (import.meta.client && syncRoute) {
    watch(
      () => getRouteConversationSlug(),
      async (slug, prev) => {
        if (!slug) {
          if (prev) {
            suppressAutoSelect.value = true
            selectedConversationId.value = null
            messages.value = []
            messagesConversationId.value = null
          }
          return
        }

        suppressAutoSelect.value = false

        const convId = conversationIdFromSlug(slug)
        if (!convId) {
          await resolveRouteConversation(slug)
          return
        }

        if (selectConversationInFlight) return

        if (selectedConversationId.value !== convId) {
          await applyConversationSelection(convId, { forceMessages: true })
          return
        }

        if (messagesConversationId.value !== convId) {
          await loadMessages(convId, { force: true })
        }
      },
      { flush: 'post' }
    )
  }

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
    openMessagesForSelection,
    isChatHydrating,
    pendingContactSelection,
    search,
    filter,
    sendingMessage,
    schedulingMessage,
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
    insightsFichaByPhone,
    pendingAnalysisByMessageId: waCopilotoPendingAnalysis,
    isMessageAnalysisPending: isWaCopilotoAnalysisPending,
    unreadTotal,
    init,
    refreshInbox,
    syncContacts,
    openContactConversation,
    selectPendingContact,
    connectWebSocket,
    disconnectWebSocket,
    loadAllConversations,
    selectConversation,
    clearConversationSelection,
    sendComposerMessage,
    scheduleComposerMessage,
    sendTemplateMessage,
    assignConversation,
    renameConversation,
    savingRename,
    createManualContact,
    loadTemplates,
    setAssignedUserFilter,
    assignedUserFilter
  }
}
