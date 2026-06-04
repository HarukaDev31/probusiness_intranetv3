<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden md:p-4">
    <PageHeader
      title="Equipo"
      subtitle="Supervisión de cola y conversaciones (solo lectura)"
      icon="i-heroicons-user-group"
      :hide-back-button="true"
    />

    <CopilotoKpiStrip :metrics="kpiMetrics" />

    <div class="grid min-h-0 flex-1 overflow-hidden rounded-lg border border-default md:grid-cols-[176px_minmax(260px,280px)_1fr_minmax(220px,240px)]">
      <CopilotoTeamRoster
        :members="teamMembers"
        :selected-id="selectedAdvisorId"
        @select="selectAdvisor"
      />
      <CopilotoLeadQueue
        title="Cola"
        v-model:search="queueSearch"
        :leads="leads"
        :loading="loadingLeads"
        :selected-index="selectedLeadIndex"
        readonly
        @select="selectLead"
      />
      <section class="flex min-h-0 min-w-0 flex-1 flex-col bg-white dark:bg-gray-900">
        <div class="flex shrink-0 border-b border-default px-2">
          <UButton
            size="xs"
            :variant="jefeView === 'cola' ? 'soft' : 'ghost'"
            :color="jefeView === 'cola' ? 'primary' : 'neutral'"
            label="Chat"
            class="flex-1 rounded-none"
            @click="setJefeView('cola')"
          />
          <UButton
            size="xs"
            :variant="jefeView === 'pipeline' ? 'soft' : 'ghost'"
            :color="jefeView === 'pipeline' ? 'primary' : 'neutral'"
            label="Pipeline"
            class="flex-1 rounded-none"
            @click="setJefeView('pipeline')"
          />
        </div>
        <CopilotoConversationPanel
          v-if="jefeView === 'cola'"
          :key="selectedLead?.id ?? 'none'"
          :lead="selectedLead"
          :conversation="selectedConversation"
          :messages="waMessages"
          :templates="[]"
          :assignable-users="[]"
          :loading="loadingConversation"
          readonly
          :main-tab="mainTab"
          :suggestion="suggestion"
          @update:main-tab="setMainTab"
        />
        <div v-else class="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
          <UAlert color="neutral" variant="subtle" title="Pipeline" description="Vista resumen por etapa (demo)." />
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <UCard v-for="stage in pipelineStages" :key="stage.id" variant="outline" :ui="{ body: 'p-3' }">
              <p class="text-xs font-bold" :style="{ color: stage.color }">{{ stage.label }}</p>
              <p class="mt-2 text-2xl font-bold text-highlighted">—</p>
            </UCard>
          </div>
        </div>
      </section>
      <CopilotoLeadFicha
        :key="`ficha-${selectedLead?.id ?? 'none'}`"
        :lead="selectedLead"
        :ficha-tab="fichaTab"
        readonly
        compact
        @update:ficha-tab="setFichaTab"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import PageHeader from '~/components/PageHeader.vue'
import CopilotoKpiStrip from '~/components/copiloto/CopilotoKpiStrip/index.vue'
import CopilotoTeamRoster from '~/components/copiloto/CopilotoTeamRoster/index.vue'
import CopilotoLeadQueue from '~/components/copiloto/CopilotoLeadQueue/index.vue'
import CopilotoConversationPanel from '~/components/copiloto/CopilotoConversationPanel/index.vue'
import CopilotoLeadFicha from '~/components/copiloto/CopilotoLeadFicha/index.vue'
import { useCopilotoDashboard } from '~/composables/copiloto/useCopilotoDashboard'
import { COPILOTO_KPI_METRICS } from '~/constants/copiloto/team'
import { setContentNarrow } from '~/composables/usePageLayout'

const pipelineStages = [
  { id: 'contacto', label: 'Contacto', color: '#475569' },
  { id: 'cotizacion', label: 'Cotización', color: '#1d4ed8' },
  { id: 'negociacion', label: 'Negociación', color: '#b45309' },
  { id: 'cierre', label: 'Cierre', color: '#15803d' }
]

const kpiMetrics = COPILOTO_KPI_METRICS

const {
  teamMembers,
  leads,
  selectedLeadIndex,
  selectedLead,
  selectedConversation,
  waMessages,
  selectedAdvisorId,
  mainTab,
  fichaTab,
  jefeView,
  loadingConversation,
  loadingLeads,
  queueSearch,
  suggestion,
  selectLead,
  selectAdvisor,
  setMainTab,
  setFichaTab,
  setJefeView
} = useCopilotoDashboard({ readonly: true })

onMounted(() => {
  setContentNarrow(false)
})
</script>
