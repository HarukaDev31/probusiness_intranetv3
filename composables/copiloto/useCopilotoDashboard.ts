import { ref, computed, watch } from 'vue'
import type { CopilotoChatMessage, CopilotoLead } from '~/types/copiloto/lead'
import { getCopilotoTempConfig } from '~/constants/copiloto/temperature'
import { MOCK_COPILOTO_LEADS } from '~/data/copiloto/mockLeads'
import { COPILOTO_TEAM_MEMBERS } from '~/constants/copiloto/team'

export type CopilotoMainTab = 'wa' | 'calls'
export type CopilotoFichaTab = 'sigs' | 'hist' | 'aduana'
export type CopilotoJefeView = 'cola' | 'pipeline'

function cloneLeads(source: CopilotoLead[]): CopilotoLead[] {
  return source.map((l) => ({
    ...l,
    hist: [...l.hist],
    msgs: l.msgs.map((m) => ({ ...m, sigs: m.sigs ? [...m.sigs] : undefined }))
  }))
}

export function useCopilotoDashboard(options?: { readonly?: boolean; filterAdvisorId?: string | null }) {
  const readonly = computed(() => options?.readonly ?? false)
  const selectedAdvisorId = ref<string>('all')

  const allLeads = ref<CopilotoLead[]>(cloneLeads(MOCK_COPILOTO_LEADS))
  const selectedLeadIndex = ref(0)
  const mainTab = ref<CopilotoMainTab>('wa')
  const fichaTab = ref<CopilotoFichaTab>('sigs')
  const jefeView = ref<CopilotoJefeView>('cola')
  const draftMessage = ref('')
  const expandedMessageIndex = ref<number | null>(null)

  const filteredLeads = computed(() => {
    const advisor = options?.filterAdvisorId ?? selectedAdvisorId.value
    if (advisor === 'all') return allLeads.value
    return allLeads.value.filter((l) => l.advisorId === advisor)
  })

  watch(filteredLeads, (list) => {
    if (selectedLeadIndex.value >= list.length) {
      selectedLeadIndex.value = Math.max(0, list.length - 1)
    }
  })

  const selectedLead = computed(() => filteredLeads.value[selectedLeadIndex.value] ?? null)

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
    if (index < 0 || index >= filteredLeads.value.length) return
    selectedLeadIndex.value = index
    expandedMessageIndex.value = null
  }

  function selectAdvisor(id: string) {
    selectedAdvisorId.value = id
    selectedLeadIndex.value = 0
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
    draftMessage.value = ''
  }

  function applySuggestionChip(text: string) {
    if (readonly.value) return
    draftMessage.value = text
  }

  return {
    readonly,
    teamMembers: COPILOTO_TEAM_MEMBERS,
    leads: filteredLeads,
    selectedLeadIndex,
    selectedLead,
    selectedAdvisorId,
    mainTab,
    fichaTab,
    jefeView,
    draftMessage,
    expandedMessageIndex,
    suggestion,
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
