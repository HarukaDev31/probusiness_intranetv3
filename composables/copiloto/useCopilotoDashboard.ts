import { ref, computed, watch, onMounted } from 'vue'
import type { CopilotoChatMessage, CopilotoLead } from '~/types/copiloto/lead'
import { getCopilotoTempConfig } from '~/constants/copiloto/temperature'
import { COPILOTO_TEAM_MEMBERS } from '~/constants/copiloto/team'
import { CopilotoService } from '~/services/copiloto/copilotoService'

export type CopilotoMainTab = 'wa' | 'calls'
export type CopilotoFichaTab = 'sigs' | 'hist' | 'aduana'
export type CopilotoJefeView = 'cola' | 'pipeline'

function timeLabel(raw: unknown): string {
  if (!raw) return ''
  const d = new Date(String(raw))
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function initialsFromName(name: string): string {
  const safe = (name || '').trim()
  if (!safe) return 'LD'
  const words = safe.split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase()
}

function mapLeadApiToUi(raw: any): CopilotoLead {
  const temp = Number(raw?.temperatura ?? 0)
  const normalizedTemp = Number.isFinite(temp) && temp >= 0 ? Math.min(temp, 100) : 0
  const tempCfg = getCopilotoTempConfig(normalizedTemp)
  const phone = String(raw?.phone ?? '')
  const convId = String(raw?.id ?? '')
  const name = String(raw?.contact_name ?? '').trim() || phone || 'Lead'
  const direction = raw?.last_direction === 'out' ? 'out' : 'in'
  const messagesCount = Number(raw?.messages_count ?? 0)
  return {
    id: convId || phone || `lead-${Date.now()}`,
    phone,
    av: initialsFromName(name),
    name,
    sub: raw?.linea ? `Línea ${String(raw.linea).toUpperCase()}` : 'Sin línea',
    score: messagesCount,
    prob: '—',
    temp: normalizedTemp,
    tLbl: tempCfg.lbl,
    action: 'Continuar seguimiento por WhatsApp',
    why: 'Sin análisis IA disponible aún',
    prev: String(raw?.last_message ?? '').trim() || 'Sin mensajes',
    dot: direction === 'in' ? '#22c55e' : '#64748b',
    cbm: '—',
    inv: '—',
    hist: [],
    msgs: [],
    advisorId: undefined,
    advisorName: undefined
  }
}

function mapMessageApiToUi(raw: any): CopilotoChatMessage {
  return {
    dir: raw?.direction === 'out' ? 'out' : 'in',
    txt: String(raw?.body ?? ''),
    t: timeLabel(raw?.sent_at ?? raw?.created_at),
    temp: undefined,
    sigs: undefined,
    why: undefined
  }
}

export function useCopilotoDashboard(options?: { readonly?: boolean; filterAdvisorId?: string | null }) {
  const readonly = computed(() => options?.readonly ?? false)
  const selectedAdvisorId = ref<string>('all')

  const allLeads = ref<CopilotoLead[]>([])
  const selectedLeadId = ref<string | null>(null)
  const mainTab = ref<CopilotoMainTab>('wa')
  const fichaTab = ref<CopilotoFichaTab>('sigs')
  const jefeView = ref<CopilotoJefeView>('cola')
  const draftMessage = ref('')
  const expandedMessageIndex = ref<number | null>(null)
  const loading = ref(false)
  const loadingConversation = ref(false)
  const error = ref<string | null>(null)
  const activeConversationRequestId = ref(0)

  const filteredLeads = computed(() => {
    const advisor = options?.filterAdvisorId ?? selectedAdvisorId.value
    if (advisor === 'all') return allLeads.value
    return allLeads.value.filter((l) => l.advisorId === advisor || !l.advisorId)
  })

  const selectedLeadIndex = computed(() => {
    if (!selectedLeadId.value) return 0
    const idx = filteredLeads.value.findIndex((l) => l.id === selectedLeadId.value)
    return idx >= 0 ? idx : 0
  })

  const selectedLead = computed(() => {
    const list = filteredLeads.value
    if (!list.length) return null
    if (selectedLeadId.value) {
      const found = list.find((l) => l.id === selectedLeadId.value)
      if (found) return found
    }
    return list[0]
  })

  const suggestion = computed(() => {
    const lead = selectedLead.value
    if (!lead) return null
    const incoming = lead.msgs.filter((m) => m.dir === 'in')
    const last = incoming[incoming.length - 1]
    if (!last?.temp) {
      return {
        label: 'Seguimiento sugerido',
        text: lead.action,
        cfg: getCopilotoTempConfig(lead.temp)
      }
    }
    const cfg = getCopilotoTempConfig(last.temp)
    return {
      label: last.temp >= 70 ? 'Mensaje nuevo — actuar ahora' : 'Copiloto sugiere',
      text: last.why || lead.why,
      cfg
    }
  })

  function selectLead(index: number) {
    const lead = filteredLeads.value[index]
    if (!lead) return
    if (selectedLeadId.value === lead.id) return
    selectedLeadId.value = lead.id
    expandedMessageIndex.value = null
  }

  function selectAdvisor(id: string) {
    selectedAdvisorId.value = id
    const first = filteredLeads.value[0]
    selectedLeadId.value = first?.id ?? null
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

  function sendMessage() {
    if (readonly.value) return
    const text = draftMessage.value.trim()
    const lead = selectedLead.value
    if (!text || !lead) return

    const now = new Date()
    const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const msg: CopilotoChatMessage = { dir: 'out', txt: text, t }
    const idx = allLeads.value.findIndex((l) => l.id === lead.id)
    if (idx >= 0) {
      allLeads.value[idx].msgs = [...allLeads.value[idx].msgs, msg]
      allLeads.value[idx].prev = text
    }
    CopilotoService.responder({
      phone: String(lead.phone || ''),
      message: text,
      conversation_id: Number(lead.id) || null
    }).catch(() => {
      // El endpoint aún puede estar en construcción; mantenemos actualización local.
    })
    draftMessage.value = ''
  }

  function applySuggestionChip(text: string) {
    if (readonly.value) return
    draftMessage.value = text
  }

  async function loadLeads() {
    loading.value = true
    error.value = null
    try {
      const response = await CopilotoService.getLeads({ per_page: 100 })
      const rows = Array.isArray(response?.data) ? response.data : []
      allLeads.value = rows.map(mapLeadApiToUi)

      if (!allLeads.value.length) {
        selectedLeadId.value = null
        return
      }

      const stillExists = selectedLeadId.value
        && allLeads.value.some((l) => l.id === selectedLeadId.value)
      if (!stillExists) {
        selectedLeadId.value = allLeads.value[0].id
      }

    } catch (err: any) {
      error.value = err?.message || 'No se pudo cargar la cola de leads'
      allLeads.value = []
      selectedLeadId.value = null
    } finally {
      loading.value = false
    }
  }

  async function loadConversationForLead(lead: CopilotoLead) {
    const requestId = ++activeConversationRequestId.value
    const conversationId = Number(lead.id)
    const phonePath = String(lead.phone || '0')

    loadingConversation.value = true
    try {
      const response = await CopilotoService.getConversacion(phonePath, {
        per_page: 200,
        conversation_id: Number.isFinite(conversationId) && conversationId > 0 ? conversationId : undefined
      })

      if (requestId !== activeConversationRequestId.value) return
      if (selectedLeadId.value !== lead.id) return

      const msgsRaw = Array.isArray(response?.data) ? response.data : []
      const idx = allLeads.value.findIndex((l) => l.id === lead.id)
      if (idx >= 0) {
        allLeads.value[idx].msgs = msgsRaw.map(mapMessageApiToUi).reverse()
      }
    } catch {
      if (requestId !== activeConversationRequestId.value) return
      if (selectedLeadId.value !== lead.id) return
      const idx = allLeads.value.findIndex((l) => l.id === lead.id)
      if (idx >= 0) {
        allLeads.value[idx].msgs = []
      }
    } finally {
      if (requestId === activeConversationRequestId.value) {
        loadingConversation.value = false
      }
    }
  }

  watch(selectedLeadId, (id) => {
    if (!id) return
    const lead = filteredLeads.value.find((l) => l.id === id)
    if (lead) {
      void loadConversationForLead(lead)
    }
  })

  onMounted(() => {
    loadLeads()
  })

  return {
    readonly,
    teamMembers: COPILOTO_TEAM_MEMBERS,
    leads: filteredLeads,
    selectedLeadIndex,
    selectedLeadId,
    selectedLead,
    selectedAdvisorId,
    mainTab,
    fichaTab,
    jefeView,
    draftMessage,
    expandedMessageIndex,
    loading,
    loadingConversation,
    error,
    suggestion,
    loadLeads,
    selectLead,
    selectAdvisor,
    setMainTab,
    setFichaTab,
    setJefeView,
    toggleMessageInsight,
    sendMessage,
    applySuggestionChip,
    getCopilotoTempConfig
  }
}
