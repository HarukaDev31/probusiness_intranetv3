<template>
  <aside
    v-if="lead || loadingHistorial"
    class="flex h-full min-h-0 max-h-full min-w-0 w-full flex-col overflow-hidden border-l border-default bg-white dark:bg-gray-900"
    :class="{ 'opacity-95': readonly }"
  >
    <div v-if="!lead && loadingHistorial" class="flex flex-1 flex-col gap-3 p-3" aria-hidden="true">
      <USkeleton class="h-4 w-40" />
      <USkeleton class="h-24 w-full rounded-lg" />
      <USkeleton class="h-16 w-full rounded-lg" />
      <USkeleton class="h-8 w-full" />
      <USkeleton class="h-32 w-full rounded-lg" />
    </div>
    <template v-else-if="lead">
    <div class="shrink-0 space-y-2 border-b border-default p-3">
      <p class="break-words text-xs font-bold text-highlighted">
        Ficha IA — {{ lead.name }}
        <span v-if="readonly && lead.advisorName" class="block text-[10px] font-normal text-muted">
          {{ lead.advisorName }}
        </span>
      </p>
      <UCard variant="subtle" :ui="{ body: 'p-2.5 space-y-2' }">
        <div class="flex justify-between">
          <div>
            <p class="text-2xl font-bold tabular-nums" :style="{ color: tempCfg(lead.temp).bar }">{{ lead.temp }}</p>
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
            :style="{ width: `${Math.max(lead.temp, lead.temp > 0 ? 4 : 0)}%`, background: tempCfg(lead.temp).bar }"
          />
        </div>
        <p v-if="lead.temp <= 0" class="text-[10px] text-muted">Sin puntaje IA aún — llegará con el primer análisis del chat.</p>
      </UCard>
      <UCard variant="outline" :ui="{ body: 'p-2.5' }">
        <p class="text-[10px] font-semibold uppercase text-muted">
          {{ readonly ? 'Recomendación' : 'Siguiente acción' }}
        </p>
        <p class="mt-1 break-words text-xs font-semibold text-highlighted">{{ lead.action }}</p>
        <p v-if="!compact" class="mt-1 break-words text-[10px] leading-snug text-muted">{{ lead.why }}</p>
      </UCard>
    </div>

    <div class="flex min-w-0 shrink-0 border-b border-default">
      <UButton
        v-for="tab in fichaTabs"
        :key="tab.value"
        size="xs"
        :variant="fichaTab === tab.value ? 'soft' : 'ghost'"
        :color="fichaTab === tab.value ? 'primary' : 'neutral'"
        :label="tab.label"
        class="min-w-0 flex-1 rounded-none px-1 text-[10px] sm:px-2 sm:text-xs"
        @click="emit('update:fichaTab', tab.value)"
      />
    </div>

    <div class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-3 text-xs">
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

        <div v-if="suggestionLogs.length" class="space-y-2 pt-2">
          <p class="text-[10px] font-semibold uppercase text-muted">Uso de sugerencias IA</p>
          <UCard
            v-for="log in suggestionLogs"
            :key="log.id"
            variant="outline"
            :ui="{ body: 'p-2 space-y-1' }"
          >
            <div class="flex items-center justify-between gap-2">
              <UBadge size="xs" :color="outcomeColor(log.outcome)" variant="subtle">
                {{ outcomeLabel(log.outcome) }}
              </UBadge>
              <span class="text-[10px] text-muted">{{ formatLogTime(log.created_at) }}</span>
            </div>
            <p class="text-[11px] text-highlighted">{{ log.suggested_text }}</p>
            <p v-if="log.final_text && log.outcome === 'modified'" class="text-[10px] text-muted">
              Enviado: {{ log.final_text }}
            </p>
          </UCard>
        </div>
      </div>

      <div v-else-if="fichaTab === 'hist'" class="space-y-2">
        <div v-if="loadingHistorial" class="space-y-2 py-4 text-center text-muted">
          <UIcon name="i-heroicons-arrow-path" class="mx-auto size-5 animate-spin" />
          <p class="text-[11px]">Cargando cotizaciones del cliente…</p>
        </div>
        <template v-else>
          <div class="grid grid-cols-2 gap-2">
            <UCard variant="subtle" :ui="{ body: 'p-2 text-center' }">
              <p class="font-bold tabular-nums">{{ lead.cbm }}</p>
              <p class="text-[10px] text-muted">Prom. CBM</p>
            </UCard>
            <UCard variant="subtle" :ui="{ body: 'p-2 text-center' }">
              <p class="font-bold tabular-nums">{{ lead.inv }}</p>
              <p class="text-[10px] text-muted">Total cotizado</p>
            </UCard>
          </div>
          <p v-if="lead.hist.length" class="text-[10px] font-semibold uppercase text-muted">
            {{ lead.hist.length }} cotización{{ lead.hist.length === 1 ? '' : 'es' }}
          </p>
          <UCard
            v-for="row in lead.hist"
            :key="row.id ?? `${row.f}-${row.r}`"
            variant="outline"
            :ui="{ body: 'p-2 space-y-0.5' }"
          >
            <div class="flex items-start justify-between gap-2">
              <span class="font-semibold text-highlighted">{{ row.f }}</span>
              <span class="shrink-0 font-medium tabular-nums text-primary">{{ row.p }}</span>
            </div>
            <p class="text-[11px] text-muted">{{ row.r }}</p>
            <p class="text-[11px] text-highlighted">{{ row.c }}</p>
          </UCard>
          <p v-if="!lead.hist.length" class="text-muted">Sin cotizaciones registradas con este número.</p>
        </template>
      </div>

      <div v-else-if="fichaTab === 'aduana'" class="space-y-2">
        <p class="text-[10px] text-muted">
          Productos, permisos y regulaciones de base de datos. El copiloto usa esto al analizar el chat.
        </p>
        <div class="flex gap-1.5">
          <UInput
            v-model="aduanaQuery"
            size="xs"
            placeholder="Buscar producto, rubro, partida…"
            class="min-w-0 flex-1"
            @keyup.enter="emit('search-aduana', aduanaQuery)"
          />
          <UButton
            size="xs"
            color="primary"
            variant="soft"
            icon="i-heroicons-magnifying-glass"
            :loading="loadingAduana"
            @click="emit('search-aduana', aduanaQuery)"
          />
        </div>
        <p v-if="aduanaSearchTerms.length" class="text-[10px] text-muted">
          Términos: {{ aduanaSearchTerms.join(', ') }}
        </p>
        <div v-if="loadingAduana" class="py-6 text-center text-muted">
          <UIcon name="i-heroicons-arrow-path" class="mx-auto size-5 animate-spin" />
          <p class="mt-2 text-[11px]">Consultando base de datos…</p>
        </div>
        <template v-else>
          <UCard
            v-for="item in aduanaItems"
            :key="`${item.tipo}-${item.id}`"
            variant="outline"
            :ui="{ body: 'p-2 space-y-1' }"
          >
            <div class="flex items-start justify-between gap-2">
              <p class="font-semibold leading-snug text-highlighted">{{ item.titulo }}</p>
              <UBadge size="xs" :color="aduanaTipoColor(item.tipo)" variant="subtle">
                {{ aduanaTipoLabel(item.tipo) }}
              </UBadge>
            </div>
            <p v-if="item.rubro" class="text-[10px] text-muted">Rubro: {{ item.rubro }}</p>
            <p v-if="item.subpartida" class="text-[10px] text-muted">Partida: {{ item.subpartida }}</p>
            <p v-if="item.entidad" class="text-[10px] text-muted">Entidad: {{ item.entidad }}</p>
            <p v-if="item.detalle" class="text-[11px] text-highlighted">{{ item.detalle }}</p>
            <p v-if="item.observaciones" class="text-[10px] leading-snug text-muted">{{ item.observaciones }}</p>
          </UCard>
          <p v-if="!aduanaItems.length" class="text-muted">
            Sin coincidencias. Prueba con el nombre del producto o busca manualmente.
          </p>
        </template>
      </div>
    </div>
    </template>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { WaCopilotoSuggestionUsage } from '~/types/wa-copiloto'
import type { CopilotoLead } from '~/types/copiloto/lead'
import type { CopilotoAduanaItem, CopilotoAduanaItemTipo } from '~/types/copiloto/aduana'
import type { CopilotoFichaTab } from '~/composables/copiloto/useCopilotoDashboard'
import { getCopilotoTempConfig } from '~/constants/copiloto/temperature'

const props = withDefaults(
  defineProps<{
    lead: CopilotoLead | null
    fichaTab: CopilotoFichaTab
    suggestionLogs?: WaCopilotoSuggestionUsage[]
    loadingHistorial?: boolean
    aduanaItems?: CopilotoAduanaItem[]
    aduanaSearchTerms?: string[]
    aduanaSearchQuery?: string
    loadingAduana?: boolean
    readonly?: boolean
    compact?: boolean
  }>(),
  {
    readonly: false,
    compact: false,
    suggestionLogs: () => [],
    loadingHistorial: false,
    aduanaItems: () => [],
    aduanaSearchTerms: () => [],
    aduanaSearchQuery: '',
    loadingAduana: false
  }
)

const emit = defineEmits<{
  'update:fichaTab': [tab: CopilotoFichaTab]
  'search-aduana': [query: string]
}>()

const aduanaQuery = ref(props.aduanaSearchQuery || '')

watch(
  () => props.aduanaSearchQuery,
  (q) => {
    aduanaQuery.value = q || ''
  }
)

const tempCfg = getCopilotoTempConfig

const fichaTabs: { value: CopilotoFichaTab; label: string }[] = [
  { value: 'sigs', label: 'Señales' },
  { value: 'hist', label: 'Hist.' },
  { value: 'aduana', label: 'Aduana' }
]

function aduanaTipoLabel(tipo: CopilotoAduanaItemTipo) {
  const map: Record<CopilotoAduanaItemTipo, string> = {
    producto: 'Producto',
    rubro: 'Rubro',
    permiso: 'Permiso',
    antidumping: 'Antidumping',
    etiquetado: 'Etiquetado',
    documento_especial: 'Doc. esp.'
  }
  return map[tipo] || tipo
}

function aduanaTipoColor(tipo: CopilotoAduanaItemTipo) {
  if (tipo === 'permiso' || tipo === 'documento_especial') return 'warning'
  if (tipo === 'antidumping') return 'error'
  if (tipo === 'etiquetado') return 'info'
  return 'neutral'
}

const incomingWithInsight = computed(() => {
  if (!props.lead) return []
  return props.lead.msgs.filter((m) => m.dir === 'in' && m.why)
})

function outcomeLabel(outcome: WaCopilotoSuggestionUsage['outcome']) {
  if (outcome === 'used') return 'Usó sugerencia'
  if (outcome === 'modified') return 'Editó sugerencia'
  return 'No usó sugerencia'
}

function outcomeColor(outcome: WaCopilotoSuggestionUsage['outcome']) {
  if (outcome === 'used') return 'success'
  if (outcome === 'modified') return 'warning'
  return 'neutral'
}

function formatLogTime(raw?: string | null) {
  if (!raw) return ''
  const d = new Date(String(raw))
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>
