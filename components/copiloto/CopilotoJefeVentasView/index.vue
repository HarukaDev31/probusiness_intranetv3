<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden md:p-4">
    <PageHeader
      title="Equipo"
      subtitle="Pipeline, cola y supervisión de conversaciones"
      icon="i-heroicons-user-group"
      :hide-back-button="true"
    />

    <CopilotoKpiStrip :metrics="kpiMetrics" />

    <CopilotoViewNav
      :scope="routeScope"
      :is-pipeline="isPipelineRoute"
      :conversation-id="selectedConversation?.id ?? null"
      cola-label="Atención"
    />

    <CopilotoPipelineKanban
      v-if="isPipelineRoute"
      :columns="pipelineColumns"
      :loading="loadingKanban"
      :can-manage-stages="canManagePipelineStages"
      :selected-id="selectedConversation?.id ?? null"
      @select="selectKanbanConversation"
      @move="moveKanbanCard"
      :on-create-stage="createPipelineStage"
      :on-reorder-stages="reorderPipelineStages"
    />

    <div
      v-else
      class="grid min-h-0 flex-1 overflow-hidden rounded-lg border border-default md:grid-cols-[minmax(260px,280px)_minmax(0,1fr)_minmax(15rem,18rem)]"
    >
      <CopilotoLeadQueue
        title="Cola"
        v-model:search="queueSearch"
        :advisor-options="advisorFilterOptions"
        :advisor-filter="selectedAdvisorId"
        :leads="leads"
        :conversations="queueConversations"
        :loading="loadingLeads"
        :selected-index="selectedLeadIndex"
        readonly
        @select="selectLead"
        @update:advisor-filter="selectAdvisor"
      />
      <CopilotoConversationPanel
        :lead="selectedLead"
        :conversation="selectedConversation"
        :messages="waMessages"
        :templates="[]"
        :assignable-users="assignableUsers"
        :loading="loadingConversation || isChatHydrating"
        readonly
        can-assign
        :main-tab="mainTab"
        :suggestion="suggestion"
        :suggestion-options="suggestionOptions"
        :analysis-pending="isLatestInboundAnalysisPending"
        :is-message-analysis-pending="isMessageAnalysisPending"
        @update:main-tab="setMainTab"
        @assign="onAssign"
      />
      <CopilotoLeadFicha
        :lead="selectedLead"
        :ficha-tab="fichaTab"
        :suggestion-logs="suggestionLogs"
        :loading-historial="loadingFicha"
        :aduana-items="aduanaItems"
        :aduana-search-terms="aduanaSearchTerms"
        :aduana-search-query="aduanaSearchQuery"
        :loading-aduana="loadingAduana"
        readonly
        compact
        @update:ficha-tab="setFichaTab"
        @search-aduana="searchAduanaContext"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import PageHeader from '~/components/PageHeader.vue'
import CopilotoKpiStrip from '~/components/copiloto/CopilotoKpiStrip/index.vue'
import CopilotoViewNav from '~/components/copiloto/CopilotoViewNav/index.vue'
import CopilotoLeadQueue from '~/components/copiloto/CopilotoLeadQueue/index.vue'
import CopilotoConversationPanel from '~/components/copiloto/CopilotoConversationPanel/index.vue'
import CopilotoLeadFicha from '~/components/copiloto/CopilotoLeadFicha/index.vue'
import CopilotoPipelineKanban from '~/components/copiloto/CopilotoPipelineKanban/index.vue'
import { useCopilotoDashboard } from '~/composables/copiloto/useCopilotoDashboard'
import { setContentNarrow } from '~/composables/usePageLayout'

const {
  routeScope,
  isPipelineRoute,
  canManagePipelineStages,
  advisorFilterOptions,
  kpiMetrics,
  pipelineColumns,
  loadingKanban,
  leads,
  queueConversations,
  selectedLeadIndex,
  selectedLead,
  selectedConversation,
  waMessages,
  selectedAdvisorId,
  mainTab,
  fichaTab,
  loadingConversation,
  isChatHydrating,
  loadingLeads,
  queueSearch,
  assignableUsers,
  suggestion,
  suggestionOptions,
  isLatestInboundAnalysisPending,
  isMessageAnalysisPending,
  suggestionLogs,
  loadingFicha,
  aduanaItems,
  aduanaSearchTerms,
  aduanaSearchQuery,
  loadingAduana,
  searchAduanaContext,
  selectLead,
  selectAdvisor,
  selectKanbanConversation,
  moveKanbanCard,
  createPipelineStage,
  reorderPipelineStages,
  assignConversation,
  setMainTab,
  setFichaTab
} = useCopilotoDashboard({ readonly: true })

async function onAssign(userId: number | null) {
  await assignConversation(userId)
}

onMounted(() => {
  setContentNarrow(false)
})
</script>
