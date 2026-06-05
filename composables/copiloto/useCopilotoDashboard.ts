import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import type { CopilotoLead, CopilotoChatMessage } from '~/types/copiloto/lead'
import type {
  CopilotoSuggestionOption,
  WaCopilotoComposerSendPayload,
  WaCopilotoConversation,
  WaCopilotoMessage,
  WaCopilotoSuggestionUsage
} from '~/types/wa-copiloto'
import { getCopilotoTempConfig } from '~/constants/copiloto/temperature'
import { COPILOTO_TEAM_MEMBERS } from '~/constants/copiloto/team'
import { CopilotoService } from '~/services/copiloto/copilotoService'
import { WaCopilotoService } from '~/services/wa-copiloto/waCopilotoService'
import { useWaCopilotoInbox } from '~/composables/useWaCopilotoInbox'

export type CopilotoMainTab = 'wa' | 'calls'
export type CopilotoFichaTab = 'sigs' | 'hist' | 'aduana'
export type CopilotoJefeView = 'cola' | 'pipeline'

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
      : (String(conv.last_message_preview ?? '').trim() || 'Sin mensajes'),
    dot: pending ? '#3b82f6' : (direction === 'in' ? '#22c55e' : '#64748b'),
    cbm: ficha?.cbm ? String(ficha.cbm) : '—',
    inv: ficha?.inversion ? String(ficha.inversion) : '—',
    hist: Array.isArray(ficha?.historial) ? ficha.historial as CopilotoLead['hist'] : [],
    msgs: [],
    advisorId: conv.assigned_user_id ? String(conv.assigned_user_id) : undefined,
    advisorName: conv.assigned_user_name || undefined
  }
}

function collectSuggestionOptions(
  messages: WaCopilotoMessage[],
  lead: CopilotoLead | null,
  ficha?: Record<string, unknown>
): CopilotoSuggestionOption[] {
  const seen = new Set<string>()
  const options: CopilotoSuggestionOption[] = []

  const pushOption = (option: CopilotoSuggestionOption) => {
    const key = option.text.trim()
    if (!key || seen.has(key)) return
    seen.add(key)
    options.push(option)
  }

  for (const msg of [...messages].reverse()) {
    for (const insight of msg.insights ?? []) {
      if (insight.kind !== 'sugerencia') continue
      pushOption({
        id: `ins-${insight.id}`,
        text: insight.body,
        label: insight.label || 'Sugerencia IA',
        insightId: insight.id,
        messageId: msg.id
      })
    }
    if (options.length >= 6) break
  }

  const fichaSug = String(ficha?.sugerencia || ficha?.accion_sugerida || '').trim()
  if (fichaSug) {
    pushOption({ id: 'ficha-sug', text: fichaSug, label: 'Respuesta sugerida' })
  }

  if (lead?.action) {
    pushOption({ id: 'ficha-action', text: lead.action, label: 'Siguiente acción' })
  }

  return options.slice(0, 6)
}

export function useCopilotoDashboard(options?: { readonly?: boolean; filterAdvisorId?: string | null }) {
  const readonly = computed(() => options?.readonly ?? false)
  const selectedAdvisorId = ref<string>('all')

  const wa = useWaCopilotoInbox()

  const fichaByPhone = ref<Record<string, Record<string, unknown>>>({})
  const loadingFicha = ref(false)
  const mainTab = ref<CopilotoMainTab>('wa')
  const fichaTab = ref<CopilotoFichaTab>('sigs')
  const jefeView = ref<CopilotoJefeView>('cola')
  const composerDraft = ref('')
  const activeSuggestion = ref<CopilotoActiveSuggestion | null>(null)
  const selectedSuggestionId = ref<string | null>(null)
  const suggestionLogs = ref<WaCopilotoSuggestionUsage[]>([])
  const expandedMessageIndex = ref<number | null>(null)

  const allLeads = computed(() =>
    wa.conversations.value.map((conv) => mapConversationToLead(conv, fichaByPhone.value[conv.phone_e164]))
  )

  const filteredLeads = computed(() => {
    const advisor = options?.filterAdvisorId ?? selectedAdvisorId.value
    if (advisor === 'all') return allLeads.value
    return allLeads.value.filter((l) => l.advisorId === advisor || !l.advisorId)
  })

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

  const selectedLeadBase = computed(() => {
    const idx = selectedLeadIndex.value
    if (idx < 0) return null
    return filteredLeads.value[idx] ?? null
  })

  const selectedLead = computed(() => {
    const lead = selectedLeadBase.value
    const conv = wa.selectedConversation.value
    if (!lead || !conv || conv.pending_contact) return lead

    const phone = String(conv.phone_e164 ?? '')
    const ficha = phone ? fichaByPhone.value[phone] : undefined
    const msgs = buildLeadMessages(wa.messages.value)

    return {
      ...lead,
      ...mapConversationToLead(conv, ficha),
      msgs
    }
  })

  const suggestionOptions = computed(() => {
    if (!selectedLead.value || wa.selectedConversation.value?.pending_contact) return []
    const phone = String(wa.selectedConversation.value?.phone_e164 ?? '')
    return collectSuggestionOptions(
      wa.messages.value,
      selectedLead.value,
      phone ? fichaByPhone.value[phone] : undefined
    )
  })

  const suggestion = computed(() => {
    const lead = selectedLead.value
    if (!lead) return null
    const cfg = getCopilotoTempConfig(lead.temp)
    const primary = suggestionOptions.value[0]
    return {
      label: lead.temp >= 70 ? 'Mensaje nuevo — actuar ahora' : 'Copiloto sugiere',
      text: primary?.text || lead.action,
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
    void wa.selectConversation(convId)
    void loadSuggestionLogs(convId)
    expandedMessageIndex.value = null
  }

  function selectAdvisor(id: string) {
    selectedAdvisorId.value = id
    const first = filteredLeads.value[0]
    if (first) {
      void selectLead(0)
    } else {
      wa.clearConversationSelection()
    }
  }

  function setMainTab(tab: CopilotoMainTab) {
    mainTab.value = tab
  }

  function setFichaTab(tab: CopilotoFichaTab) {
    fichaTab.value = tab
  }

  function setJefeView(view: CopilotoJefeView) {
    jefeView.value = view
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

  async function loadFichaForPhone(phone: string) {
    const key = String(phone || '').trim()
    if (!key || fichaByPhone.value[key]) return

    loadingFicha.value = true
    try {
      const response = await CopilotoService.getFicha(key)
      if (response?.data) {
        fichaByPhone.value = { ...fichaByPhone.value, [key]: response.data }
      }
    } catch {
      // Ficha IA opcional mientras se migra el backend legacy
    } finally {
      loadingFicha.value = false
    }
  }

  watch(
    () => wa.insightsFichaByPhone.value,
    (map) => {
      if (!map || !Object.keys(map).length) return
      fichaByPhone.value = { ...fichaByPhone.value, ...map }
    },
    { deep: true }
  )

  watch(
    () => wa.messages.value,
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
    () => wa.selectedConversation.value?.phone_e164,
    (phone) => {
      if (phone) void loadFichaForPhone(phone)
    }
  )

  watch(
    () => wa.selectedConversation.value?.id,
    (id) => {
      if (id && !wa.selectedConversation.value?.pending_contact) {
        void loadSuggestionLogs(Number(id))
      }
    }
  )

  onMounted(async () => {
    await wa.init()
    wa.connectWebSocket()
  })

  onBeforeUnmount(() => {
    wa.disconnectWebSocket()
  })

  return {
    readonly,
    teamMembers: COPILOTO_TEAM_MEMBERS,
    leads: filteredLeads,
    selectedLeadIndex,
    selectedLead,
    selectedAdvisorId,
    selectedConversation: wa.selectedConversation,
    pendingContactSelection: wa.pendingContactSelection,
    waMessages: wa.messages,
    templates: wa.templates,
    assignableUsers: wa.assignableUsers,
    loadingConversation: wa.loadingMessages,
    loadingLeads: wa.loadingConversations,
    loadingTemplates: wa.loadingTemplates,
    sendingMessage: wa.sendingMessage,
    sendingTemplate: wa.sendingTemplate,
    savingNewContact: wa.savingNewContact,
    savingRename: wa.savingRename,
    mainTab,
    fichaTab,
    jefeView,
    composerDraft,
    activeSuggestion,
    selectedSuggestionId,
    suggestionLogs,
    expandedMessageIndex,
    loading: wa.loadingConversations,
    loadingFicha,
    error: wa.error,
    suggestion,
    suggestionOptions,
    selectLead,
    selectAdvisor,
    setMainTab,
    setFichaTab,
    setJefeView,
    toggleMessageInsight,
    sendWaMessage,
    sendTemplateMessage: wa.sendTemplateMessage,
    createManualContact: wa.createManualContact,
    renameConversation: wa.renameConversation,
    assignConversation: wa.assignConversation,
    applySuggestionChip,
    setComposerDraft,
    refreshLeads: wa.refreshInbox,
    syncContacts: wa.syncContacts,
    queueSearch: wa.search,
    getCopilotoTempConfig
  }
}
