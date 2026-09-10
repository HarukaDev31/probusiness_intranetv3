<template>
  <div class="md:p-6">
    <DataTable
      title="Cotizaciones"
      icon="i-heroicons-document-text"
      :show-title="true"
      :data="cotizaciones"
      :columns="columns"
      :loading="loading"
      :current-page="pagination.current_page"
      :total-pages="pagination.last_page"
      :total-records="pagination.total"
      :items-per-page="pagination.per_page"
      :show-primary-search="true"
      primary-search-placeholder="Buscar por nombre, documento o teléfono..."
      :show-filters="true"
      :filter-config="filterConfig"
      :filters-value="filters"
      :show-new-button="true"
      new-button-label="Crear Cotización"
      :on-new-button-click="() => navigateTo('/cotizaciones/resumen/crear')"
      empty-state-message="No se encontraron cotizaciones."
      @update:primary-search="onSearch"
      @page-change="onPageChange"
      @items-per-page-change="onItemsPerPageChange"
      @filter-change="onFilterChange"
    />
  </div>
</template>

<script setup lang="ts">
import { h, ref, reactive, resolveComponent, onMounted } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { CotizacionResumenService } from '~/services/cargaconsolidada/cotizacionResumenService'
import type { CotizacionResumenRow, CotizacionResumenProveedorRow } from '~/services/cargaconsolidada/cotizacionResumenService'
import type { FilterConfig } from '~/types/data-table'
import { useModal } from '~/composables/commons/useModal'

definePageMeta({
  middleware: 'auth'
})

const { showError } = useModal()

const UBadge = resolveComponent('UBadge')
const USelect = resolveComponent('USelect')

// ─── Estado China: solo lectura acá, lo cambia Almacén China en su vista ──
const CHINA_COLORS: Record<string, [string, string]> = {
  WAIT: ['#6B7280', '#FFFFFF'],
  NC: ['#93C5FD', '#12213D'],
  NP: ['#EF4444', '#FFFFFF'],
  C: ['#F0B000', '#FFFFFF'],
  R: ['#22C55E', '#FFFFFF'],
  INSPECTION: ['#2F6FE0', '#FFFFFF'],
  LOADED: ['#16A34A', '#FFFFFF'],
  'NO LOADED': ['#E5E7EB', '#4A5C7A']
}

const ESTADO_OPTIONS = [
  { label: 'Pendiente', value: 'PENDIENTE' },
  { label: 'Confirmado', value: 'CONFIRMADO' },
  { label: 'Declinado', value: 'DECLINADO' }
]

// ─── Data ───────────────────────────────────────────────────────────────────
const cotizaciones = ref<CotizacionResumenRow[]>([])
const loading = ref(false)
const search = ref('')
const pagination = ref({ current_page: 1, last_page: 1, per_page: 10, total: 0 })
const filters = reactive<Record<string, string>>({ estado: '' })

const filterConfig: FilterConfig[] = [
  { key: 'estado', label: 'Estado', placeholder: 'Todos', options: ESTADO_OPTIONS.map(e => ({ label: e.label, value: e.value })) }
]

async function loadCotizaciones(page = pagination.value.current_page) {
  loading.value = true
  const res = await CotizacionResumenService.getCotizaciones({
    search: search.value || undefined,
    estado: filters.estado || undefined,
    page,
    per_page: pagination.value.per_page
  })
  if (res.success) {
    cotizaciones.value = res.data
    if (res.pagination) {
      pagination.value = {
        current_page: res.pagination.current_page,
        last_page: res.pagination.last_page,
        per_page: res.pagination.per_page,
        total: res.pagination.total
      }
    }
  } else {
    showError('Error al cargar cotizaciones', res.message || 'Intenta nuevamente.')
  }
  loading.value = false
}

function onSearch(value: string) {
  search.value = value
  loadCotizaciones(1)
}

function onPageChange(page: number) {
  loadCotizaciones(page)
}

function onItemsPerPageChange(perPage: number) {
  pagination.value.per_page = perPage
  loadCotizaciones(1)
}

function onFilterChange(key: string, value: string) {
  filters[key] = value === 'todos' ? '' : value
  loadCotizaciones(1)
}

async function onEstadoChange(row: CotizacionResumenRow, value: string) {
  const previo = row.estado
  row.estado = value as any
  const res = await CotizacionResumenService.updateEstado(row.id, value as any)
  if (!res.success) {
    row.estado = previo
    showError('No se pudo actualizar el estado', res.message || 'Intenta nuevamente.')
  }
}

// ─── Columnas ───────────────────────────────────────────────────────────────
const columns: TableColumn<CotizacionResumenRow>[] = [
  { accessorKey: 'id', header: 'ID' },
  {
    accessorKey: 'fecha',
    header: 'Fecha',
    cell: ({ row }) => row.original.fecha ? formatDateTimeToDmy(row.original.fecha) : '—'
  },
  {
    accessorKey: 'nombre',
    header: 'Contacto',
    cell: ({ row }) => h('div', { class: 'flex flex-col gap-0.5 max-w-[190px]' }, [
      h('span', { class: 'font-medium text-sm' }, row.original.nombre || '—'),
      h('span', { class: 'text-xs text-gray-500' }, row.original.documento || ''),
      h('span', { class: 'text-xs text-gray-500' }, row.original.telefono || '')
    ])
  },
  {
    accessorKey: 'total_cbm',
    header: 'Vol (CBM)',
    cell: ({ row }) => Number(row.original.total_cbm || 0).toFixed(2)
  },
  { accessorKey: 'total_cajas', header: 'Cajas' },
  {
    accessorKey: 'contenedor',
    header: 'Campaña',
    cell: ({ row }) => row.original.contenedor || '—'
  },
  { accessorKey: 'vendedor', header: 'Vendedor', cell: ({ row }) => row.original.vendedor || '—' },
  {
    accessorKey: 'productos',
    header: 'Proveedores / Productos',
    cell: ({ row }) => h('div', { class: 'flex flex-col gap-1 max-w-[220px]' },
      row.original.proveedores.map((p, i) =>
        h('span', { class: 'text-xs text-gray-600 dark:text-gray-300 truncate', title: p.producto || '' }, `#${i + 1} ${p.producto || '—'}`)
      )
    )
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => h(USelect as any, {
      items: ESTADO_OPTIONS,
      modelValue: row.original.estado,
      class: 'min-w-36',
      'onUpdate:modelValue': (value: string) => onEstadoChange(row.original, value)
    })
  },
  {
    accessorKey: 'china',
    header: 'China',
    cell: ({ row }) => h('div', { class: 'flex flex-col gap-2' },
      row.original.proveedores.map((p: CotizacionResumenProveedorRow) => {
        const china = p.estado_china || 'WAIT'
        const [bg, fg] = CHINA_COLORS[china] || CHINA_COLORS.WAIT
        return h(UBadge as any, {
          style: `background:${bg};color:${fg};`,
          class: 'w-full justify-center',
          title: 'Solo Almacén China puede cambiar este estado'
        }, () => china)
      })
    )
  }
]

onMounted(() => loadCotizaciones())
</script>
