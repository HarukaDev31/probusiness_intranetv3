<template>
  <div class="flex flex-col gap-[18px] pb-[18px] pt-1" data-manual-capture="consolidado-filter-bar">
    <PageHeader :title="t.title" :hide-back-button="hideBackButton" @back="emit('back')" />

    <section class="flex flex-col gap-2.5 rounded-[14px] border border-default bg-default px-4 py-3" :aria-label="t.filters">
      <div class="flex flex-wrap items-center gap-2">
        <label class="flex h-10 min-w-0 flex-[1_1_260px] items-center gap-2 rounded-[10px] border border-default bg-default px-3 text-muted focus-within:border-primary focus-within:ring-2 focus-within:ring-primary">
          <UIcon name="i-heroicons-magnifying-glass" class="size-4 flex-none" />
          <input
            :value="searchText"
            type="search"
            class="min-w-0 flex-1 bg-transparent text-sm text-highlighted outline-none placeholder:text-muted"
            :placeholder="t.search"
            :aria-label="t.search"
            @input="onSearch(($event.target as HTMLInputElement).value)"
          >
        </label>

        <span class="mr-1.5 inline-flex h-10 items-center gap-2 rounded-[10px] bg-primary/10 px-3 text-sm font-bold text-primary-700 dark:text-primary-300">
          <UIcon name="i-heroicons-funnel" class="size-4" />{{ t.filters }}
          <span
            v-if="activeCount"
            class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-700 px-1.5 text-[11px] font-bold text-white"
            :aria-label="`${activeCount} ${activeCount === 1 ? t.activeOne : t.activeMany}`"
          >{{ activeCount }}</span>
        </span>

        <UPopover
          v-for="filter in visibleFilters"
          :key="filter.key"
          :content="{ align: 'start', sideOffset: 6 }"
          :ui="{ content: 'min-w-60 max-w-80 rounded-xl p-2 shadow-[0_12px_28px_rgba(15,23,42,.14)]' }"
          @update:open="(open: boolean) => (openKey = open ? filter.key : (openKey === filter.key ? null : openKey))"
        >
          <button
            type="button"
            class="inline-flex h-10 items-center gap-1.5 rounded-[10px] border px-3 text-sm transition-colors"
            :class="selected(filter.key).length ? 'border-primary-700 bg-primary/10' : 'border-default bg-default hover:border-accented'"
            :aria-expanded="openKey === filter.key"
          >
            <span class="font-medium text-muted">{{ filter.label }}</span>
            <span class="font-semibold" :class="selected(filter.key).length ? 'font-bold text-primary-700 dark:text-primary-300' : 'text-highlighted'">{{ triggerValue(filter.key) }}</span>
            <UIcon name="i-heroicons-chevron-down" class="size-3.5 text-muted transition-transform" :class="openKey === filter.key ? 'rotate-180' : ''" />
          </button>
          <template #content>
            <div class="flex max-h-[260px] flex-col gap-0.5 overflow-auto" role="group" :aria-label="filter.label">
              <label class="mb-0.5 flex min-h-10 cursor-pointer items-center gap-2.5 rounded-t-lg border-b border-default px-2.5 py-1.5 text-sm font-medium hover:bg-elevated">
                <UCheckbox :model-value="!selected(filter.key).length" @update:model-value="emit('change', filter.key, [])" />
                {{ t.all }}
              </label>
              <label
                v-for="option in options(filter.key)"
                :key="option.value"
                class="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium hover:bg-elevated"
              >
                <UCheckbox :model-value="selected(filter.key).includes(option.value)" @update:model-value="(on: boolean | 'indeterminate') => toggle(filter.key, option.value, on === true)" />
                {{ optionLabel(filter.key, option.label) }}
                <span class="ml-auto text-xs text-muted">{{ option.count }}</span>
              </label>
            </div>
          </template>
        </UPopover>

        <span class="ml-auto inline-flex items-center gap-2">
          <template v-if="activeCount">
            <span class="h-6 w-px bg-default" />
            <button
              type="button"
              class="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold text-primary-700 hover:bg-primary/10 dark:text-primary-300"
              @click="emit('clear')"
            >
              <UIcon name="i-heroicons-x-mark" class="size-3.5" />{{ t.clear }}
            </button>
          </template>
          <span class="whitespace-nowrap text-[13px] text-muted" aria-live="polite"><b class="text-highlighted">{{ total }}</b> {{ t.of }} {{ overall }}</span>
        </span>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { ContenedorFacetKey, ContenedorFacets, ContenedorFilters } from '~/types/cargaconsolidada/contenedor'

const props = defineProps<{
  title: string
  search: string
  filters: ContenedorFilters
  facets: ContenedorFacets | null
  total: number
  overall: number
  english: boolean
  /** Etiqueta de cada estado (PENDIENTE → WAITING en Almacén). */
  statusLabels?: Record<string, string>
  /** Estados que no aplican a esta vista (p. ej. COMPLETADO en abiertos). */
  hiddenStatuses?: string[]
  hideBackButton?: boolean
}>()
const emit = defineEmits<{ search: [value: string]; change: [key: ContenedorFacetKey, values: string[]]; clear: []; back: [] }>()

const openKey = ref<string | null>(null)
const searchText = ref(props.search)
let timer: ReturnType<typeof setTimeout> | null = null

watch(() => props.search, (value) => {
  if (value !== searchText.value) searchText.value = value
})

const t = computed(() => (props.english
  ? { title: props.title, search: 'Search cargo or company', filters: 'Filters', all: 'All', selected: 'selected', clear: 'Clear', of: 'of', activeOne: 'active filter', activeMany: 'active filters', year: 'Year', country: 'Country', company: 'Company', status: 'Status' }
  : { title: props.title, search: 'Buscar carga o empresa', filters: 'Filtros', all: 'Todos', selected: 'seleccionados', clear: 'Limpiar', of: 'de', activeOne: 'filtro activo', activeMany: 'filtros activos', year: 'Año', country: 'País', company: 'Empresa', status: 'Estado' }))

const visibleFilters = computed(() => ([
  { key: 'anio', label: t.value.year },
  { key: 'id_pais', label: t.value.country },
  { key: 'empresa', label: t.value.company },
  { key: 'estado_china', label: t.value.status }
] as { key: ContenedorFacetKey; label: string }[]))

function selected(key: ContenedorFacetKey): string[] {
  const value = props.filters[key]
  if (Array.isArray(value)) return value
  return value && value !== 'todos' ? [value] : []
}

const activeCount = computed(() => visibleFilters.value.reduce((sum, filter) => sum + selected(filter.key).length, 0))

function options(key: ContenedorFacetKey) {
  const list = props.facets?.[key] || []
  return key === 'estado_china' ? list.filter((option) => !(props.hiddenStatuses || []).includes(option.value)) : list
}

/** Año y empresa tal cual; país y estado en formato título (ENERO → Enero), como la maqueta. */
function optionLabel(key: ContenedorFacetKey, label: string): string {
  if (key === 'estado_china') {
    const text = props.statusLabels?.[label] || label
    return text.charAt(0) + text.slice(1).toLowerCase()
  }
  if (key === 'id_pais') return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()
  return label
}

function triggerValue(key: ContenedorFacetKey): string {
  const values = selected(key)
  if (!values.length) return t.value.all
  if (values.length > 1) return `${values.length} ${t.value.selected}`
  const option = (props.facets?.[key] || []).find((item) => item.value === values[0])
  return optionLabel(key, option?.label || values[0])
}

function toggle(key: ContenedorFacetKey, value: string, on: boolean) {
  const current = selected(key)
  emit('change', key, on ? [...new Set([...current, value])] : current.filter((item) => item !== value))
}

function onSearch(value: string) {
  searchText.value = value
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => emit('search', value.trim()), 300)
}

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>
