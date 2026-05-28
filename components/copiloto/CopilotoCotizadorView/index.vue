<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3 md:p-4">
    <PageHeader
      title="Copiloto IA"
      :subtitle="headerSubtitle"
      icon="i-heroicons-sparkles"
      :hide-back-button="true"
    />

    <div class="grid min-h-0 flex-1 overflow-hidden rounded-lg border border-default bg-[#f0f4f9] dark:bg-gray-950 md:grid-cols-[190px_1fr_256px] md:min-h-[min(72vh,760px)]">
      <CopilotoLeadQueue
        title="Mi cola"
        :leads="leads"
        :selected-index="selectedLeadIndex"
        @select="selectLead"
      />
      <CopilotoConversationPanel
        :key="selectedLead?.id ?? 'none'"
        :lead="selectedLead"
        :loading="loadingConversation"
        :main-tab="mainTab"
        :draft-message="draftMessage"
        :expanded-message-index="expandedMessageIndex"
        :suggestion="suggestion"
        @update:main-tab="setMainTab"
        @update:draft-message="(v) => (draftMessage = v)"
        @send="sendMessage"
        @toggle-insight="toggleMessageInsight"
        @apply-chip="applySuggestionChip"
      />
      <CopilotoLeadFicha
        :key="`ficha-${selectedLead?.id ?? 'none'}`"
        :lead="selectedLead"
        :ficha-tab="fichaTab"
        @update:ficha-tab="setFichaTab"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import PageHeader from '~/components/PageHeader.vue'
import CopilotoLeadQueue from '~/components/copiloto/CopilotoLeadQueue/index.vue'
import CopilotoConversationPanel from '~/components/copiloto/CopilotoConversationPanel/index.vue'
import CopilotoLeadFicha from '~/components/copiloto/CopilotoLeadFicha/index.vue'
import { useCopilotoDashboard } from '~/composables/copiloto/useCopilotoDashboard'
import { useUserRole } from '~/composables/auth/useUserRole'
import { setContentNarrow } from '~/composables/usePageLayout'

const { userData } = useUserRole()

const {
  leads,
  selectedLeadIndex,
  selectedLead,
  mainTab,
  fichaTab,
  draftMessage,
  expandedMessageIndex,
  loadingConversation,
  suggestion,
  selectLead,
  setMainTab,
  setFichaTab,
  toggleMessageInsight,
  sendMessage,
  applySuggestionChip
} = useCopilotoDashboard({ readonly: false })

const headerSubtitle = computed(() => {
  const name = userData.value?.nombre || 'Cotizador'
  return `Cola de atención · ${name}`
})

onMounted(() => {
  setContentNarrow(false)
})
</script>
