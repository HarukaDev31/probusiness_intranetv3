import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  copilotoConversationPath,
  copilotoIsPipelinePath,
  copilotoListPath,
  copilotoPipelinePath,
  copilotoRouteConversationSlug,
  type CopilotoRouteScope
} from '~/utils/copilotoRoute'
import type { CopilotoLead, CopilotoChatMessage } from '~/types/copiloto/lead'
import type {
  CopilotoSuggestionOption,
  WaCopilotoComposerSendPayload,
  WaCopilotoConversation,
  WaCopilotoMessage,
  WaCopilotoSuggestionUsage
} from '~/types/wa-copiloto'
import { getCopilotoTempConfig } from '~/constants/copiloto/temperature'
import { getWaInboxSidebarPreviewMeta } from '~/utils/whatsappInboxSidebarPreview'
import { useCopilotoPipeline } from '~/composables/copiloto/useCopilotoPipeline'
import { CopilotoService } from '~/services/copiloto/copilotoService'
import { WaCopilotoService } from '~/services/wa-copiloto/waCopilotoService'
import { useWaCopilotoInbox } from '~/composables/useWaCopilotoInbox'
import { waMessageNumericId } from '~/composables/wa-copiloto-inbox/waCopilotoMessageUtils'
import type { CopilotoAduanaItem } from '~/types/copiloto/aduana'

export type CopilotoMainTab = 'wa' | 'calls'
export type CopilotoFichaTab = 'sigs' | 'hist' | 'aduana'
export type CopilotoActiveSuggestion = {
  optionId: string
  text: string
  insightId?: number
  messageId?: number
}

function initialsFromName(name: string): string {
  const safe = (name || '').trim()
  if (!safe) return 'LD'
  const words = safe.split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase()
}

function conversationRowKey(conv: WaCopilotoConversation): string {
  if (conv.pending_contact && conv.contact_id) {
    return `ct-${conv.contact_id}`
  }
  return String(conv.id)
}

function formatMessageTime(raw?: string | null) {
  if (!raw) return ''
  const d = new Date(String(raw))
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function buildLeadMessages(messages: WaCopilotoMessage[]): CopilotoChatMessage[] {
  return messages.map((m) => {
    const insights = m.insights ?? []
    const tempInsight = insights.find((i) => i.kind === 'temperatura')
    const commentInsight = insights.find((i) => i.kind === 'comentario')
    const suggestionInsight = insights.find((i) => i.kind === 'sugerencia')
    const why = commentInsight?.body || suggestionInsight?.body || insights[0]?.body

    return {
      dir: m.direction === 'out' ? 'out' : 'in',
      txt: String(m.body ?? '').trim() || `[${m.message_type || 'mensaje'}]`,
      t: formatMessageTime(m.sent_at || m.created_at),
      temp: tempInsight?.score ?? undefined,
      why: why || undefined
    }
  })
}

function resolveLeadTemperatura(
  conv: WaCopilotoConversation,
  ficha?: Record<string, unknown>
): { temp: number; hasScore: boolean } {
  const fromFicha = ficha?.temperatura
  if (fromFicha != null && fromFicha !== '') {
    const n = Number(fromFicha)
    if (Number.isFinite(n) && n >= 0) {
      return { temp: Math.min(n, 100), hasScore: true }
    }
  }

  if (conv.temperatura != null) {
    const n = Number(conv.temperatura)
    if (Number.isFinite(n) && n >= 0) {
      return { temp: Math.min(n, 100), hasScore: true }
    }
  }

  return { temp: 0, hasScore: false }
}

function mapConversationToLead(conv: WaCopilotoConversation, ficha?: Record<string, unknown>): CopilotoLead {
  const { temp, hasScore } = resolveLeadTemperatura(conv, ficha)
  const tempCfg = getCopilotoTempConfig(temp)
  const phone = String(conv.phone_e164 ?? '')
  const name = String(conv.contact_name ?? '').trim() || conv.phone_display || phone || 'Lead'
  const direction = conv.last_direction === 'out' ? 'out' : 'in'
  const pending = Boolean(conv.pending_contact)
  const originHint = conv.origin_line_number
    ? `Registrado en ${conv.origin_line_label || 'línea'} · ${conv.origin_line_number}`
    : null

  const senales = Array.isArray(ficha?.senales) ? ficha.senales as string[] : []
  const previewMeta = pending ? null : getWaInboxSidebarPreviewMeta(conv)

  return {
    id: conversationRowKey(conv),
    phone,
    av: initialsFromName(name),
    name,
    sub: pending ? (originHint || conv.channel_label || 'Directorio') : (conv.channel_label || 'WhatsApp'),
    score: temp,
    prob: !hasScore ? '—' : temp >= 70 ? 'Alta' : temp >= 40 ? 'Media' : 'Baja',
    temp,
    tLbl: pending ? 'Sin chat' : (!hasScore ? 'Sin IA' : tempCfg.lbl),
    action: String(ficha?.accion_sugerida || ficha?.sugerencia_corta || ficha?.sugerencia || '').trim()
      || (pending ? 'Enviar plantilla para abrir conversación' : 'Continuar seguimiento por WhatsApp'),
    why: String(ficha?.motivo || ficha?.objecion || '').trim()
      || (senales.length ? senales.slice(0, 2).join(' · ') : 'Sin análisis IA disponible aún'),
    prev: pending
      ? 'Sin chat en esta línea — usa plantilla'
      : (previewMeta?.label || String(conv.last_message_preview ?? '').trim() || 'Sin mensajes'),
    prevTime: conv.last_message_time_label || formatMessageTime(conv.last_message_at),
    dot: pending ? '#3b82f6' : (direction === 'in' ? '#22c55e' : '#64748b'),
    cbm: ficha?.cbm != null && String(ficha.cbm).trim() !== '' ? String(ficha.cbm) : '—',
    inv: ficha?.inversion != null && String(ficha.inversion).trim() !== '' ? String(ficha.inversion) : '—',
    hist: Array.isArray(ficha?.historial)
      ? (ficha.historial as CopilotoLead['hist'])
      : [],
    msgs: [],
    advisorId: conv.assigned_user_id ? String(conv.assigned_user_id) : undefined,
    advisorName: conv.assigned_user_name || undefined
  }
}

function normalizeSuggestionKey(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase()
}

function isDuplicateSuggestion(text: string, seen: Set<string>): boolean {
  const key = normalizeSuggestionKey(text)
  if (!key || seen.has(key)) return true
  for (const existing of seen) {
    if (existing.includes(key) || key.includes(existing)) return true
  }
  return false
}

function findLatestInboundMessage(messages: WaCopilotoMessage[]): WaCopilotoMessage | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].direction === 'in') return messages[i]
  }
  return null
}

function collectSuggestionOptionsForMessage(msg: WaCopilotoMessage | null): CopilotoSuggestionOption[] {
  if (!msg) return []

  const seen = new Set<string>()
  const options: CopilotoSuggestionOption[] = []

  for (const insight of msg.insights ?? []) {
    if (insight.kind !== 'sugerencia') continue
    if (isDuplicateSuggestion(insight.body, seen)) continue
    seen.add(normalizeSuggestionKey(insight.body))
    options.push({
      id: `ins-${insight.id}`,
      text: insight.body,
      label: insight.label || 'Sugerencia IA',
      insightId: insight.id,
      messageId: msg.id
    })
  }

  return options.slice(0, 4)
}

export function useCopilotoDashboard(options?: { readonly?: boolean; filterAdvisorId?: string | null }) {
  const route = useRoute()
  const router = useRouter()
  const readonly = computed(() => options?.readonly ?? false)
  const selectedAdvisorId = ref<string>('all')
  const isJefeView = computed(() => options?.readonly === true)
  const routeScope = computed<CopilotoRouteScope>(() => (isJefeView.value ? 'equipo' : 'advisor'))

  const wa = useWaCopilotoInbox({
    copilotoQueue: isJefeView.value ? 'copiloto-jefe' : 'copiloto-advisor',
    routeScope: routeScope.value,
    syncRoute: true
  })
  const pipeline = useCopilotoPipeline({ canManageStages: isJefeView.value })

  const isPipelineRoute = computed(() => copilotoIsPipelinePath(route.path, routeScope.value))
  const hasConversationRoute = computed(() => Boolean(copilotoRouteConversationSlug(route)))

  const fichaByPhone = ref<Record<string, Record<string, unknown>>>({})
  const loadingFicha = ref(false)
  const mainTab = ref<CopilotoMainTab>('wa')
  const fichaTab = ref<CopilotoFichaTab>('sigs')
  const composerDraft = ref('')
  const activeSuggestion = ref<CopilotoActiveSuggestion | null>(null)
  const selectedSuggestionId = ref<string | null>(null)
  const suggestionLogs = ref<WaCopilotoSuggestionUsage[]>([])
  const expandedMessageIndex = ref<number | null>(null)
  const aduanaItems = ref<CopilotoAduanaItem[]>([])
  const aduanaSearchTerms = ref<string[]>([])
  const aduanaSearchQuery = ref('')
  const loadingAduana = ref(false)

  const allLeads = computed(() =>
    wa.conversations.value.map((conv) => mapConversationToLead(conv, fichaByPhone.value[conv.phone_e164]))
  )

  const advisorFilterOptions = computed(() => {
    const rows = [{ label: 'Todo el equipo', value: 'all' }]
    for (const user of wa.assignableUsers.value) {
      rows.push({ label: user.name, value: String(user.id) })
    }
    return rows
  })

  const filteredLeads = computed(() => allLeads.value)

  const filteredConversations = computed(() => wa.conversations.value)

  const selectedLeadIndex = computed(() => {
    const conv = wa.selectedConversation.value
    if (!conv) {
      const pending = wa.pendingContactSelection.value
      if (pending) {
        return filteredLeads.value.findIndex((l) => l.id === `ct-${pending.contact_id}`)
      }
      return -1
    }
    const key = conversationRowKey(conv)
    return filteredLeads.value.findIndex((l) => l.id === key)
  })

  const selectedLead = computed(() => {
    const conv = wa.selectedConversation.value
    if (!conv) {
      const pending = wa.pendingContactSelection.value
      if (!pending) return null
      return mapConversationToLead(pending, undefined)
    }

    const phone = String(conv.phone_e164 ?? '')
    const ficha = phone ? fichaByPhone.value[phone] : undefined
    const base = mapConversationToLead(conv, ficha)
    if (conv.pending_contact) return base

    const msgs = buildLeadMessages(wa.openMessagesForSelection.value)
    return { ...base, msgs }
  })

  const latestInboundMessage = computed(() =>
    findLatestInboundMessage(wa.openMessagesForSelection.value)
  )

  const isLatestInboundAnalysisPending = computed(() => {
    const msg = latestInboundMessage.value
    const msgId = msg ? waMessageNumericId(msg.id) : 0
    return msgId > 0 ? wa.isMessageAnalysisPending(msgId) : false
  })

  const suggestionOptions = computed(() => {
    if (!selectedLead.value || wa.selectedConversation.value?.pending_contact) return []
    return collectSuggestionOptionsForMessage(latestInboundMessage.value)
  })

  const suggestion = computed(() => {
    const lead = selectedLead.value
    if (!lead) return null
    const cfg = getCopilotoTempConfig(lead.temp)
    const primary = suggestionOptions.value[0]
    const pending = isLatestInboundAnalysisPending.value
    return {
      label: pending
        ? 'Copiloto analizando…'
        : (lead.temp >= 70 ? 'Mensaje nuevo — actuar ahora' : 'Copiloto sugiere'),
      text: primary?.text || (pending ? '' : lead.action),
      cfg
    }
  })

  async function loadSuggestionLogs(conversationId: number) {
    if (!conversationId || conversationId <= 0) {
      suggestionLogs.value = []
      return
    }
    try {
      const res = await WaCopilotoService.getSuggestionUsages(conversationId, { limit: 30 })
      suggestionLogs.value = Array.isArray(res?.data) ? res.data : []
    } catch {
      suggestionLogs.value = []
    }
  }

  async function persistSuggestionUsage(payload: {
    outcome: 'used' | 'modified' | 'ignored'
    suggested_text: string
    final_text?: string
    message_id?: number
    insight_id?: number
  }) {
    const convId = Number(wa.selectedConversation.value?.id)
    if (!convId || readonly.value) return

    try {
      const res = await WaCopilotoService.recordSuggestionUsage(convId, payload)
      if (res?.data) {
        suggestionLogs.value = [res.data, ...suggestionLogs.value.filter((row) => row.id !== res.data.id)]
      }
    } catch {
      // historial opcional si falla red
    }
  }

  async function markActiveSuggestionIgnored() {
    const active = activeSuggestion.value
    if (!active || readonly.value) return
    await persistSuggestionUsage({
      outcome: 'ignored',
      suggested_text: active.text,
      message_id: active.messageId,
      insight_id: active.insightId
    })
    activeSuggestion.value = null
    selectedSuggestionId.value = null
  }

  async function selectLead(index: number) {
    const lead = filteredLeads.value[index]
    if (!lead) return

    activeSuggestion.value = null
    selectedSuggestionId.value = null
    composerDraft.value = ''

    if (lead.id.startsWith('ct-')) {
      const contactId = Number(lead.id.slice(3))
      if (!Number.isFinite(contactId) || contactId <= 0) return
      const pending = wa.conversations.value.find(
        (c) => c.pending_contact && c.contact_id === contactId
      )
      wa.selectPendingContact(pending ?? null)
      suggestionLogs.value = []
      expandedMessageIndex.value = null
      return
    }

    const convId = Number(lead.id)
    if (!Number.isFinite(convId) || convId <= 0) return
    await wa.selectConversation(convId)
    expandedMessageIndex.value = null
  }

  function goPipeline() {
    void router.push(copilotoPipelinePath(routeScope.value))
  }

  function goCola() {
    const id = wa.selectedConversationId.value
    if (id) void router.push(copilotoConversationPath(routeScope.value, id))
    else void router.push(copilotoListPath(routeScope.value))
  }

  function selectAdvisor(id: string) {
    selectedAdvisorId.value = id
    const userId = id === 'all' ? null : Number(id)
    wa.setAssignedUserFilter(Number.isFinite(userId) && userId! > 0 ? userId : null)
    if (isJefeView.value) {
      pipeline.setAssignedFilter(Number.isFinite(userId) && userId! > 0 ? userId : null)
    }
    const first = filteredLeads.value[0]
    if (first) {
      void selectLead(0)
    } else {
      wa.clearConversationSelection()
    }
  }

  async function selectKanbanConversation(conversationId: number) {
    await wa.selectConversation(conversationId)
  }

  async function moveKanbanCard(conversationId: number, stageId: number) {
    await pipeline.moveCard(conversationId, stageId)
  }

  async function createPipelineStage(label: string, conversationId?: number) {
    await pipeline.createProgressStage(label, conversationId)
  }

  async function reorderPipelineStages(orderedStageIds: number[]) {
    await pipeline.reorderProgressStages(orderedStageIds)
  }

  function setMainTab(tab: CopilotoMainTab) {
    mainTab.value = tab
  }

  function setFichaTab(tab: CopilotoFichaTab) {
    fichaTab.value = tab
    if (tab === 'aduana') {
      syncAduanaFromOpenChat()
    }
  }

  function searchAduanaContext(query: string) {
    void loadAduanaContext(query)
  }

  function toggleMessageInsight(messageIndex: number) {
    expandedMessageIndex.value = expandedMessageIndex.value === messageIndex ? null : messageIndex
  }

  function applySuggestionChip(option: CopilotoSuggestionOption | string) {
    if (readonly.value) return

    if (typeof option === 'string') {
      composerDraft.value = option
      activeSuggestion.value = { optionId: 'legacy', text: option }
      selectedSuggestionId.value = null
      return
    }

    composerDraft.value = option.text
    activeSuggestion.value = {
      optionId: option.id,
      text: option.text,
      insightId: option.insightId,
      messageId: option.messageId
    }
    selectedSuggestionId.value = option.id
  }

  function setComposerDraft(value: string) {
    composerDraft.value = value
  }

  async function sendWaMessage(payload: WaCopilotoComposerSendPayload) {
    if (readonly.value) return

    const sentText = String(payload.text ?? '').trim()
    const active = activeSuggestion.value

    await wa.sendComposerMessage(payload)

    if (active && sentText) {
      const suggested = active.text.trim()
      const outcome = sentText === suggested ? 'used' : 'modified'
      await persistSuggestionUsage({
        outcome,
        suggested_text: suggested,
        final_text: sentText,
        message_id: active.messageId,
        insight_id: active.insightId
      })
    }

    composerDraft.value = ''
    activeSuggestion.value = null
    selectedSuggestionId.value = null
  }

  function mergeFichaFromInsights(phone: string) {
    const key = String(phone || '').trim()
    if (!key) return
    const snapshot = wa.insightsFichaByPhone.value[key]
    if (!snapshot) return
    fichaByPhone.value = {
      ...fichaByPhone.value,
      [key]: { ...(fichaByPhone.value[key] ?? {}), ...snapshot }
    }
  }

  function buildAduanaSearchFromMessages(messages: WaCopilotoMessage[]): string {
    const chunks: string[] = []
    for (let i = messages.length - 1; i >= 0 && chunks.length < 4; i--) {
      const msg = messages[i]
      if (msg.direction !== 'in') continue
      const text = String(msg.body ?? '').trim()
      if (text) chunks.push(text)
    }
    return chunks.reverse().join(' ')
  }

  async function loadAduanaContext(query?: string) {
    const q = String(query ?? aduanaSearchQuery.value ?? '').trim()
    if (!q) {
      aduanaItems.value = []
      aduanaSearchTerms.value = []
      return
    }

    loadingAduana.value = true
    try {
      const response = await CopilotoService.getAduanaContext({ q, limit: 18 })
      const data = response?.data
      aduanaItems.value = Array.isArray(data?.items) ? data.items : []
      aduanaSearchTerms.value = Array.isArray(data?.terms) ? data.terms : []
      aduanaSearchQuery.value = q
    } catch {
      aduanaItems.value = []
      aduanaSearchTerms.value = []
    } finally {
      loadingAduana.value = false
    }
  }

  function syncAduanaFromOpenChat() {
    const msgs = wa.openMessagesForSelection.value
    const autoQuery = buildAduanaSearchFromMessages(msgs)
    if (!autoQuery.trim()) {
      aduanaItems.value = []
      aduanaSearchTerms.value = []
      aduanaSearchQuery.value = ''
      return
    }
    if (autoQuery !== aduanaSearchQuery.value) {
      void loadAduanaContext(autoQuery)
    }
  }

  async function loadFichaForPhone(phone: string) {
    const key = String(phone || '').trim()
    if (!key) return

    mergeFichaFromInsights(key)

    loadingFicha.value = true
    try {
      const response = await CopilotoService.getFicha(key)
      if (response?.data) {
        fichaByPhone.value = {
          ...fichaByPhone.value,
          [key]: {
            ...(fichaByPhone.value[key] ?? {}),
            ...response.data,
            ...(wa.insightsFichaByPhone.value[key] ?? {})
          }
        }
      }
    } catch {
      // Ficha IA opcional mientras se migra el backend legacy
    } finally {
      loadingFicha.value = false
    }
  }

  function syncLeadContextFromSelection() {
    const conv = wa.selectedConversation.value
    if (!conv || conv.pending_contact) return

    const phone = String(conv.phone_e164 ?? '').trim()
    const convId = Number(conv.id)
    if (!phone || !Number.isFinite(convId) || convId <= 0) return

    mergeFichaFromInsights(phone)
    void loadFichaForPhone(phone)
    void loadSuggestionLogs(convId)
  }

  watch(
    () => {
      const phone = String(wa.selectedConversation.value?.phone_e164 ?? '').trim()
      return phone ? wa.insightsFichaByPhone.value[phone] : undefined
    },
    (snapshot) => {
      if (!snapshot) return
      mergeFichaFromInsights(String(wa.selectedConversation.value?.phone_e164 ?? ''))
    },
    { deep: true }
  )

  watch(
    () => wa.openMessagesForSelection.value,
    (messages, prev) => {
      if (!activeSuggestion.value || !prev?.length) return
      const prevIds = new Set(
        prev.flatMap((m) => (m.insights ?? []).map((i) => i.id))
      )
      const hasNewInsight = messages.some((m) =>
        (m.insights ?? []).some((i) => !prevIds.has(i.id))
      )
      if (hasNewInsight) {
        void markActiveSuggestionIgnored()
      }
    },
    { deep: true }
  )

  watch(
    () => wa.selectedConversation.value?.id,
    (id, prevId) => {
      if (id === prevId) return
      activeSuggestion.value = null
      selectedSuggestionId.value = null
      aduanaItems.value = []
      aduanaSearchTerms.value = []
      aduanaSearchQuery.value = ''
      syncLeadContextFromSelection()
    },
    { immediate: true }
  )

  watch(
    () => [fichaTab.value, wa.openMessagesForSelection.value.length] as const,
    ([tab]) => {
      if (tab === 'aduana') {
        syncAduanaFromOpenChat()
      }
    }
  )

  watch(isPipelineRoute, (onPipeline) => {
    if (onPipeline) void pipeline.loadKanban()
  })

  onMounted(async () => {
    await wa.init()
    if (isJefeView.value) {
      await pipeline.loadKpis()
    }
    if (isPipelineRoute.value) {
      await pipeline.loadKanban()
    }
  })

  return {
    readonly,
    advisorFilterOptions,
    isJefeView,
    kpiMetrics: pipeline.kpiMetrics,
    pipelineColumns: pipeline.columns,
    loadingKanban: pipeline.loadingKanban,
    loadingKpis: pipeline.loadingKpis,
    refreshPipeline: pipeline.refreshAll,
    leads: filteredLeads,
    queueConversations: filteredConversations,
    selectedLeadIndex,
    selectedLead,
    selectedAdvisorId,
    selectedConversation: wa.selectedConversation,
    pendingContactSelection: wa.pendingContactSelection,
    waMessages: wa.openMessagesForSelection,
    templates: wa.templates,
    assignableUsers: wa.assignableUsers,
    loadingConversation: wa.loadingMessages,
    isChatHydrating: wa.isChatHydrating,
    loadingLeads: wa.loadingConversations,
    loadingTemplates: wa.loadingTemplates,
    sendingMessage: wa.sendingMessage,
    sendingTemplate: wa.sendingTemplate,
    savingNewContact: wa.savingNewContact,
    savingRename: wa.savingRename,
    mainTab,
    fichaTab,
    routeScope,
    isPipelineRoute,
    hasConversationRoute,
    goPipeline,
    goCola,
    canManagePipelineStages: pipeline.canManageStages,
    composerDraft,
    activeSuggestion,
    selectedSuggestionId,
    suggestionLogs,
    expandedMessageIndex,
    loading: wa.loadingConversations,
    loadingFicha,
    loadFichaForPhone,
    aduanaItems,
    aduanaSearchTerms,
    aduanaSearchQuery,
    loadingAduana,
    searchAduanaContext,
    error: wa.error,
    suggestion,
    suggestionOptions,
    latestInboundMessage,
    isLatestInboundAnalysisPending,
    isMessageAnalysisPending: wa.isMessageAnalysisPending,
    selectLead,
    selectAdvisor,
    selectKanbanConversation,
    moveKanbanCard,
    createPipelineStage,
    reorderPipelineStages,
    setMainTab,
    setFichaTab,
    toggleMessageInsight,
    sendWaMessage,
    sendTemplateMessage: wa.sendTemplateMessage,
    createManualContact: wa.createManualContact,
    renameConversation: wa.renameConversation,
    assignConversation: async (userId: number | null) => {
      await wa.assignConversation(userId)
      await pipeline.refreshAll()
    },
    applySuggestionChip,
    setComposerDraft,
    refreshLeads: wa.refreshInbox,
    syncContacts: wa.syncContacts,
    queueSearch: wa.search,
    getCopilotoTempConfig
  }
}
