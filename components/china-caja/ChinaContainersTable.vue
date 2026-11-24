<template>
  <DataTable
    keep-spanish-headers
    filters-layout="inline"
    :fill-viewport="false"
    :data="rows"
    :columns="columns"
    :loading="loading"
    :current-page="1" :total-pages="1" :total-records="rows.length" :items-per-page="Math.max(1, rows.length)" :show-pagination="false"
    :primary-search-value="search"
    :show-primary-search="true"
    :show-primary-search-label="false"
    primary-search-placeholder="Buscar por cliente, BL, naviera o consignatario"
    :show-filters="true"
    :filter-config="filterConfig"
    :filters-value="filters"
    :show-export="false"
    :inline-count-text="`${rows.length} ${rows.length === 1 ? 'contenedor' : 'contenedores'}`"
    empty-state-message="No hay contenedores: solo aparecen los que ya tienen fecha de llenado o están cerrados en China."
    @update:primary-search="(value: string) => emit('search', value)"
    @filter-change="onFilter"
    @clear-filters="emit('clear')"
  />
</template>

<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { CHINA_COLLECTION, CHINA_CONTAINER_GROUP, type ChinaColor } from '~/constants/chinaCaja'
import type { ChinaContainer } from '~/types/china-caja'
import type { FilterConfig } from '~/types/data-table'
import { containerArrivalText } from '~/utils/chinaCaja'
import { dayLabel, usd } from '~/utils/yuanFormat'
import { UBadge, UButton } from '#components'

defineProps<{ rows: ChinaContainer[]; loading: boolean; search: string; filterConfig: FilterConfig[]; filters: Record<string, string> }>()
const emit = defineEmits<{ select: [id: number]; search: [value: string]; filter: [key: string, value: string]; clear: [] }>()

const badge = (label: string, color: ChinaColor) => h(UBadge, { color, variant: 'soft' }, () => label)
/** Gris mientras no toca pedirlo, naranja cuando ya se solicitó, verde cuando está listo. */
const check = (done: boolean, due: boolean) => badge(done ? 'Sí' : 'No', done ? 'success' : due ? 'primary' : 'neutral')
const lines = (title: string, ...details: Array<{ text: string; tone?: string }>) => h('div', [
  h('p', { class: 'font-semibold text-highlighted' }, title),
  ...details.map((detail) => h('p', { class: `text-xs ${detail.tone || 'text-muted'}` }, detail.text))
])

const columns: TableColumn<ChinaContainer>[] = [
  { id: 'group', header: 'Estado', cell: ({ row }) => badge(CHINA_CONTAINER_GROUP[row.original.status.group].label, CHINA_CONTAINER_GROUP[row.original.status.group].color) },
  { id: 'filling_on', header: 'F. llenado', cell: ({ row }) => dayLabel(row.original.data.filling_on || row.original.closed_on) },
  { id: 'client', header: 'Cliente', cell: ({ row }) => lines(row.original.client, { text: `CNE: ${row.original.data.bl_consignee || '—'}` }, { text: row.original.country }) },
  {
    id: 'cargo',
    header: 'Carga / BL',
    cell: ({ row: { original } }) => lines(
      `${original.label} · ${original.data.container_type || '—'}`,
      { text: containerArrivalText(original), tone: original.status.arrival_due ? 'font-semibold text-primary' : '' },
      { text: `BL ${original.data.bl_number || 'pendiente'}`, tone: original.data.bl_number ? '' : 'text-warning' }
    )
  },
  { id: 'freight', header: 'Flete', cell: ({ row }) => (row.original.data.freight_usd ? usd(row.original.data.freight_usd) : '—') },
  { id: 'bl', header: 'BL oficial', cell: ({ row }) => check(!!row.original.data.bl_official_name, row.original.status.bl_due) },
  { id: 'telex', header: 'Telex', cell: ({ row }) => check(row.original.data.telex, row.original.status.arrival_due) },
  { id: 'paid', header: 'Flete pagado', cell: ({ row }) => check(row.original.freight.paid, row.original.status.arrival_due) },
  { id: 'collection', header: 'Cobro cliente', cell: ({ row }) => badge(CHINA_COLLECTION[row.original.collection].label, CHINA_COLLECTION[row.original.collection].color) },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => h(UButton, { size: 'xs', icon: 'i-heroicons-eye', color: 'info', variant: 'ghost', 'aria-label': 'Ver contenedor', onClick: () => emit('select', row.original.id) })
  }
]

function onFilter(key: string, value: unknown) {
  const normalized = value && typeof value === 'object' && 'value' in value ? value.value : value
  emit('filter', key, String(normalized ?? ''))
}
</script>
