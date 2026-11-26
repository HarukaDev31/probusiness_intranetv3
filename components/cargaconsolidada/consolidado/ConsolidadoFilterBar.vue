<template>
  <!-- Misma cabecera y barra destacada que DataTable (prominent-toolbar), con los filtros a la vista. -->
  <div class="flex flex-col flex-wrap gap-4 p-0 md:flex-row md:p-4" data-manual-capture="consolidado-filter-bar">
    <div class="flex w-full flex-col items-start gap-1 md:gap-3">
      <PageHeader :title="title" :hide-back-button="hideBackButton" @back="emit('back')" />

      <div class="flex w-full flex-wrap items-center gap-2 rounded-xl border-2 border-primary bg-white p-2 shadow-md dark:bg-gray-800">
        <UInput
          :model-value="searchText"
          :placeholder="t.search"
          class="min-w-[18rem] flex-1"
          :ui="{ base: 'h-12 text-base bg-orange-50 dark:bg-gray-900' }"
          @update:model-value="onSearch"
        >
          <template #leading>
            <UIcon name="i-heroicons-magnifying-glass" class="text-gray-400" />
          </template>
        </UInput>

        <span class="inline-flex h-12 items-center gap-2 rounded-md border border-primary bg-white px-4 text-base font-semibold text-gray-900 dark:bg-gray-900 dark:text-gray-100">
          <UIcon name="i-heroicons-funnel" class="size-5" />{{ t.filters }}
          <UBadge v-if="activeCount" color="primary" size="sm" :label="String(activeCount)" />
        </span>

        <USelectMenu
          v-for="filter in visibleFilters"
          :key="filter.key"
          :model-value="menuValue(filter.key)"
          :items="menuItems(filter.key)"
          value-key="value"
          label-key="label"
          multiple
          :search-input="false"
          :aria-label="filter.label"
          class="min-w-40"
          :ui="{ base: ['h-12 text-base', selected(filter.key).length ? 'ring-primary bg-orange-50 dark:bg-gray-900' : ''].join(' '), content: 'min-w-60' }"
          @update:model-value="(value: string[]) => onSelect(filter.key, value)"
        >
          <template #default>
            <span class="truncate">
              <span class="text-muted">{{ filter.label }}</span>
              <span class="ml-1 font-semibold" :class="selected(filter.key).length ? 'text-primary' : 'text-highlighted'">{{ triggerValue(filter.key) }}</span>
            </span>
          </template>
          <template #item-trailing="{ item }">
            <span v-if="item.value !== ALL" class="text-xs text-muted">{{ item.count }}</span>
          </template>
        </USelectMenu>

        <span class="ml-auto inline-flex items-center gap-2">
          <UButton v-if="activeCount" color="primary" variant="link" icon="i-heroicons-x-mark" :label="t.clear" @click="emit('clear')" />
          <span class="whitespace-nowrap text-sm text-muted" aria-live="polite"><b class="text-highlighted">{{ total }}</b> {{ t.of }} {{ overall }}</span>
        </span>
      </div>
    </div>
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

/** Opción «Todos» dentro de cada desplegable: marcada cuando no hay selección. */
const ALL = '__all'
const searchText = ref(props.search)
let timer: ReturnType<typeof setTimeout> | null = null

watch(() => props.search, (value) => {
  if (value !== searchText.value) searchText.value = value
})

const t = computed(() => (props.english
  ? { search: 'Search cargo or company', filters: 'Filters', all: 'All', selected: 'selected', clear: 'Clear', of: 'of', year: 'Year', country: 'Country', company: 'Company', status: 'Status' }
  : { search: 'Buscar carga o empresa', filters: 'Filtros', all: 'Todos', selected: 'seleccionados', clear: 'Limpiar', of: 'de', year: 'Año', country: 'País', company: 'Empresa', status: 'Estado' }))

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

/** Año y empresa tal cual; país y estado en formato título (ENERO → Enero), como la maqueta. */
function optionLabel(key: ContenedorFacetKey, label: string): string {
  if (key === 'estado_china') {
    const text = props.statusLabels?.[label] || label
    return text.charAt(0) + text.slice(1).toLowerCase()
  }
  if (key === 'id_pais') return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()
  return label
}

function menuItems(key: ContenedorFacetKey) {
  const hidden = key === 'estado_china' ? props.hiddenStatuses || [] : []
  const options = (props.facets?.[key] || [])
    .filter((option) => !hidden.includes(option.value))
    .map((option) => ({ value: option.value, label: optionLabel(key, option.label), count: option.count }))
  return [{ value: ALL, label: t.value.all, count: 0 }, ...options]
}

function menuValue(key: ContenedorFacetKey): string[] {
  const values = selected(key)
  return values.length ? values : [ALL]
}

/** Marcar «Todos» limpia el filtro; marcar otra opción quita «Todos». */
function onSelect(key: ContenedorFacetKey, value: string[]) {
  const hadAll = !selected(key).length
  if (!hadAll && value.includes(ALL)) return emit('change', key, [])
  emit('change', key, value.filter((item) => item !== ALL))
}

function triggerValue(key: ContenedorFacetKey): string {
  const values = selected(key)
  if (!values.length) return t.value.all
  if (values.length > 1) return `${values.length} ${t.value.selected}`
  const option = (props.facets?.[key] || []).find((item) => item.value === values[0])
  return optionLabel(key, option?.label || values[0])
}

function onSearch(value: string | number) {
  searchText.value = String(value)
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => emit('search', searchText.value.trim()), 300)
}

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>
