<template>
  <SectionHeader
    :title="title"
    :headers="kpiHeaders"
    @click-header="onClickHeader"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SectionHeader from '~/components/commons/SectionHeader.vue'
import type { Header, HeaderSubline } from '~/types/data-table'

const props = withDefaults(defineProps<{
  headers?: Record<string, Header> | null
  title?: string | null
}>(), {
  headers: () => ({}),
  title: null,
})

const emit = defineEmits<{
  'filter-nc': []
}>()

const DATE_KEYS = new Set(['fecha_cbm_60', 'fecha_cbm_65'])

const kpiHeaders = computed<Header[]>(() => {
  const source = props.headers || {}
  const fecha60 = source.fecha_cbm_60
  const fecha65 = source.fecha_cbm_65
  const warehouseSublines: HeaderSubline[] = []
  if (fecha60) {
    warehouseSublines.push({ label: '60 CBM', value: String(fecha60.value ?? '—') })
  }
  if (fecha65) {
    warehouseSublines.push({ label: '65 CBM', value: String(fecha65.value ?? '—') })
  }

  const cards: Header[] = []
  const orderedKeys = [
    'cbm_pais',
    'cbm_vendido',
    'cbm_pendiente',
    'cbm_warehouse',
    'total_customers',
    'total_suppliers_code',
    'total_nc',
  ]
  const seen = new Set<string>()

  const pushCard = (key: string, header?: Header) => {
    if (!header || seen.has(key) || DATE_KEYS.has(key)) return
    seen.add(key)
    cards.push({
      ...header,
      key,
      clickable: key === 'total_nc',
      hint: key === 'total_nc' ? (header.hint || 'Click to filter NC') : header.hint,
      sublines: key === 'cbm_warehouse' ? warehouseSublines : header.sublines,
    })
  }

  for (const key of orderedKeys) {
    if (key === 'cbm_warehouse') {
      pushCard(key, source.cbm_warehouse || {
        label: 'CBM Warehouse',
        value: '0',
        icon: 'fluent:box-32-filled',
      })
      continue
    }
    pushCard(key, source[key])
  }

  for (const [key, header] of Object.entries(source)) {
    pushCard(key, header)
  }

  return cards
})

const onClickHeader = (header: Header) => {
  if (header.key === 'total_nc' || header.clickable) {
    emit('filter-nc')
  }
}
</script>
