<template>
  <aside
    v-if="lead"
    class="flex h-full min-h-0 max-h-full w-64 shrink-0 flex-col overflow-hidden border-l border-default bg-white dark:bg-gray-900 xl:w-72"
    :class="{ 'opacity-95': readonly }"
  >
    <div class="shrink-0 space-y-2 border-b border-default p-3">
      <p class="text-xs font-bold text-highlighted">
        Ficha IA — {{ lead.name }}
        <span v-if="readonly && lead.advisorName" class="block text-[10px] font-normal text-muted">
          {{ lead.advisorName }}
        </span>
      </p>
      <UCard variant="subtle" :ui="{ body: 'p-2.5 space-y-2' }">
        <div class="flex justify-between">
          <div>
            <p class="text-2xl font-bold tabular-nums" :style="{ color: tempCfg(lead.temp).bar }">{{ lead.score }}</p>
            <p class="text-[10px] text-muted">{{ lead.tLbl }}</p>
          </div>
          <div class="text-right">
            <p class="text-lg font-bold text-highlighted">{{ lead.prob }}</p>
            <p class="text-[10px] text-muted">Prob. cierre 7d</p>
          </div>
        </div>
        <div class="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            class="h-full rounded-full transition-all"
            :style="{ width: `${lead.temp}%`, background: tempCfg(lead.temp).bar }"
          />
        </div>
      </UCard>
      <UCard variant="outline" :ui="{ body: 'p-2.5' }">
        <p class="text-[10px] font-semibold uppercase text-muted">
          {{ readonly ? 'Recomendación' : 'Siguiente acción' }}
        </p>
        <p class="mt-1 text-xs font-semibold text-highlighted">{{ lead.action }}</p>
        <p v-if="!compact" class="mt-1 text-[10px] leading-snug text-muted">{{ lead.why }}</p>
      </UCard>
    </div>

    <div class="flex shrink-0 border-b border-default">
      <UButton
        v-for="tab in fichaTabs"
        :key="tab.value"
        size="xs"
        :variant="fichaTab === tab.value ? 'soft' : 'ghost'"
        :color="fichaTab === tab.value ? 'primary' : 'neutral'"
        :label="tab.label"
        class="flex-1 rounded-none"
        @click="emit('update:fichaTab', tab.value)"
      />
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto p-3 text-xs">
      <div v-if="fichaTab === 'sigs'" class="space-y-2">
        <UCard
          v-for="(msg, i) in incomingWithInsight"
          :key="i"
          variant="subtle"
          :ui="{ body: 'p-2' }"
        >
          <p class="font-medium text-highlighted">{{ msg.txt.slice(0, 80) }}{{ msg.txt.length > 80 ? '…' : '' }}</p>
          <p v-if="msg.why" class="mt-1 text-[10px] text-muted">{{ msg.why }}</p>
        </UCard>
        <p v-if="!incomingWithInsight.length" class="text-muted">Sin señales detalladas.</p>
      </div>

      <div v-else-if="fichaTab === 'hist'" class="space-y-2">
        <div class="grid grid-cols-2 gap-2">
          <UCard variant="subtle" :ui="{ body: 'p-2 text-center' }">
            <p class="font-bold">{{ lead.cbm }}</p>
            <p class="text-[10px] text-muted">Prom. mensual</p>
          </UCard>
          <UCard variant="subtle" :ui="{ body: 'p-2 text-center' }">
            <p class="font-bold">{{ lead.inv }}</p>
            <p class="text-[10px] text-muted">Total invertido</p>
          </UCard>
        </div>
        <div v-for="row in lead.hist" :key="row.f" class="border-b border-default py-1.5 last:border-0">
          <span class="font-medium">{{ row.f }}</span> · {{ row.r }} · {{ row.c }} · {{ row.p }}
        </div>
        <p v-if="!lead.hist.length" class="text-muted">Sin historial de importaciones.</p>
      </div>

      <div v-else class="space-y-2">
        <UCard variant="subtle" :ui="{ body: 'p-2 text-[11px] leading-relaxed' }">
          <strong>Cap. 61 — Prendas de punto</strong><br>
          Partida 6109.10: 12% arancel. Certificado de origen requerido en TLC Perú-China.
        </UCard>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CopilotoLead } from '~/types/copiloto/lead'
import type { CopilotoFichaTab } from '~/composables/copiloto/useCopilotoDashboard'
import { getCopilotoTempConfig } from '~/constants/copiloto/temperature'

const props = withDefaults(
  defineProps<{
    lead: CopilotoLead | null
    fichaTab: CopilotoFichaTab
    readonly?: boolean
    compact?: boolean
  }>(),
  {
    readonly: false,
    compact: false
  }
)

const emit = defineEmits<{
  'update:fichaTab': [tab: CopilotoFichaTab]
}>()

const tempCfg = getCopilotoTempConfig

const fichaTabs = computed(() => {
  const base = [
    { value: 'sigs' as const, label: 'Señales' },
    { value: 'hist' as const, label: 'Hist.' }
  ]
  if (!props.compact) {
    base.push({ value: 'aduana' as const, label: 'Aduanas' })
  }
  return base
})

const incomingWithInsight = computed(() => {
  if (!props.lead) return []
  return props.lead.msgs.filter((m) => m.dir === 'in' && m.why)
})
</script>
