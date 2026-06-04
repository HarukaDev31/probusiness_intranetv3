import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import type { CopilotoLead } from '~/types/copiloto/lead'
import type { WaCopilotoComposerSendPayload, WaCopilotoConversation } from '~/types/wa-copiloto'
import { getCopilotoTempConfig } from '~/constants/copiloto/temperature'
import { COPILOTO_TEAM_MEMBERS } from '~/constants/copiloto/team'
import { CopilotoService } from '~/services/copiloto/copilotoService'
import { useWaCopilotoInbox } from '~/composables/useWaCopilotoInbox'

export type CopilotoMainTab = 'wa' | 'calls'
export type CopilotoFichaTab = 'sigs' | 'hist' | 'aduana'
export type CopilotoJefeView = 'cola' | 'pipeline'

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

function mapConversationToLead(conv: WaCopilotoConversation, ficha?: any): CopilotoLead {
  const temp = Number(ficha?.temperatura ?? 0)
  const normalizedTemp = Number.isFinite(temp) && temp >= 0 ? Math.min(temp, 100) : 0
  const tempCfg = getCopilotoTempConfig(normalizedTemp)
  const phone = String(conv.phone_e164 ?? '')
  const name = String(conv.contact_name ?? '').trim() || conv.phone_display || phone || 'Lead'
  const direction = conv.last_direction === 'out' ? 'out' : 'in'
  const pending = Boolean(conv.pending_contact)
  const originHint = conv.origin_line_number
    ? `Registrado en ${conv.origin_line_label || 'línea'} · ${conv.origin_line_number}`
    : null

  return {
    id: conversationRowKey(conv),
    phone,
    av: initialsFromName(name),
    name,
    sub: pending ? (originHint || conv.channel_label || 'Directorio') : (conv.channel_label || 'WhatsApp'),
    score: Number(conv.unread_count ?? 0),
    prob: ficha?.probabilidad ? String(ficha.probabilidad) : '—',
    temp: normalizedTemp,
    tLbl: pending ? 'Sin chat' : tempCfg.lbl,
    action: ficha?.accion_sugerida || (pending ? 'Enviar plantilla para abrir conversación' : 'Continuar seguimiento por WhatsApp'),
    why: ficha?.motivo || 'Sin análisis IA disponible aún',
    prev: pending
      ? 'Sin chat en esta línea — usa plantilla'
      : (String(conv.last_message_preview ?? '').trim() || 'Sin mensajes'),
    dot: pending ? '#3b82f6' : (direction === 'in' ? '#22c55e' : '#64748b'),
    cbm: ficha?.cbm ? String(ficha.cbm) : '—',
    inv: ficha?.inversion ? String(ficha.inversion) : '—',
    hist: Array.isArray(ficha?.historial) ? ficha.historial : [],
    msgs: [],
    advisorId: conv.assigned_user_id ? String(conv.assigned_user_id) : undefined,
    advisorName: conv.assigned_user_name || undefined
  }
}

export function useCopilotoDashboard(options?: { readonly?: boolean; filterAdvisorId?: string | null }) {
  const readonly = computed(() => options?.readonly ?? false)
  const selectedAdvisorId = ref<string>('all')

  const wa = useWaCopilotoInbox()

  const fichaByPhone = ref<Record<string, any>>({})
  const loadingFicha = ref(false)
  const mainTab = ref<CopilotoMainTab>('wa')
  const fichaTab = ref<CopilotoFichaTab>('sigs')
  const jefeView = ref<CopilotoJefeView>('cola')
  const draftMessage = ref('')
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

  const selectedLead = computed(() => {
    const idx = selectedLeadIndex.value
    if (idx < 0) return null
    return filteredLeads.value[idx] ?? null
  })

  const suggestion = computed(() => {
    const lead = selectedLead.value
    if (!lead) return null
    const cfg = getCopilotoTempConfig(lead.temp)
    return {
      label: lead.temp >= 70 ? 'Mensaje nuevo — actuar ahora' : 'Copiloto sugiere',
      text: lead.action,
      cfg
    }
  })

  async function selectLead(index: number) {
    const lead = filteredLeads.value[index]
    if (!lead) return

    if (lead.id.startsWith('ct-')) {
      const contactId = Number(lead.id.slice(3))
      if (!Number.isFinite(contactId) || contactId <= 0) return
      const pending = wa.conversations.value.find(
        (c) => c.pending_contact && c.contact_id === contactId
      )
      wa.selectPendingContact(pending ?? null)
      expandedMessageIndex.value = null
      return
    }

    const convId = Number(lead.id)
    if (!Number.isFinite(convId) || convId <= 0) return
    void wa.selectConversation(convId)
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

  async function sendWaMessage(payload: WaCopilotoComposerSendPayload) {
    if (readonly.value) return
    await wa.sendComposerMessage(payload)
  }

  function applySuggestionChip(text: string) {
    if (readonly.value) return
    draftMessage.value = text
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
    () => wa.selectedConversation.value?.phone_e164,
    (phone) => {
      if (phone) void loadFichaForPhone(phone)
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
    draftMessage,
    expandedMessageIndex,
    loading: wa.loadingConversations,
    loadingFicha,
    error: wa.error,
    suggestion,
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
    refreshLeads: wa.refreshInbox,
    syncContacts: wa.syncContacts,
    queueSearch: wa.search,
    getCopilotoTempConfig
  }
}
