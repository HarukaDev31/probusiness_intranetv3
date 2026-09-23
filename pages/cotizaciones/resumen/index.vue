<template>
  <div class="md:p-6">
    <CustomersKpiCards class="mb-4" :headers="headers" :loading="loading" @filter-nc="filterByNc" />
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
      primary-search-placeholder="Buscar por"
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
      @clear-filters="onClearFilters"
    />
  </div>
</template>

<script setup lang="ts">
import { h, ref, reactive, computed, onMounted, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { UButton } from '#components'
import { useCotizacionResumen } from '~/composables/cargaconsolidada/cotizacion-resumen'
import type { CotizacionResumenRow, CotizacionResumenProveedorRow } from '~/types/cargaconsolidada/cotizacion-resumen'
import type { FilterConfig, Header } from '~/types/data-table'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { STATUS_BG_CLASSES, CUSTOMIZED_ICONS } from '~/constants/ui'
import { formatCurrency, formatDateTimeToDmy } from '~/utils/formatters'
import { normalizePublicFileUrl } from '~/utils/storageFileUrl'
import CustomersKpiCards from '~/components/cargaconsolidada/customers/CustomersKpiCards.vue'

definePageMeta({
  middleware: 'auth'
})

const { showError, showSuccess, showConfirmation } = useModal()
const { withSpinner } = useSpinner()
const {
  getCotizaciones,
  updateEstado,
  deleteCotizacion,
  duplicarCotizacion,
  loadVendedores,
  loadContenedores,
  vendedoresOptions,
  contenedoresOptions
} = useCotizacionResumen()

const UBadge = resolveComponent('UBadge')
const USelect = resolveComponent('USelect')

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
  { label: 'COTIZADO', value: 'COTIZADO' },
  { label: 'CONFIRMADO', value: 'CONFIRMADO' }
]

const CHINA_OPTIONS = [
  { label: 'WAIT', value: 'WAIT' },
  { label: 'NC', value: 'NC' },
  { label: 'NP', value: 'NP' },
  { label: 'C', value: 'C' },
  { label: 'R', value: 'R' },
  { label: 'INSPECTION', value: 'INSPECTION' },
  { label: 'LOADED', value: 'LOADED' },
  { label: 'NO LOADED', value: 'NO LOADED' }
]

const cotizaciones = ref<CotizacionResumenRow[]>([])
const headers = ref<Record<string, Header>>({})
const loading = ref(true)
const search = ref('')
const pagination = ref({ current_page: 1, last_page: 1, per_page: 10, total: 0 })
const FILTER_ALL = new Set(['todos', 'todas', 'all', 'todo'])

const filters = reactive<Record<string, string>>({
  fecha_inicio: '',
  fecha_fin: '',
  id_contenedor: 'todos',
  estado: 'todos',
  id_usuario: 'todos',
  estado_china: 'todos'
})

function filtroActivo(value: string | undefined | null): string | undefined {
  const raw = String(value ?? '').trim()
  if (!raw || FILTER_ALL.has(raw.toLowerCase())) return undefined
  return raw
}

function etiquetaConsolidadoCampania(label: string) {
  const cargaAnio = String(label || '')
    .replace(/^(Contenedor|Consolidado)\s*#?\s*/i, '')
    .replace(/^#/, '')
    .trim()
  return cargaAnio ? `Consolidado #${cargaAnio}` : 'Consolidado'
}

const filterConfig = computed<FilterConfig[]>(() => [
  { key: 'fecha_inicio', label: 'Fecha Inicio', type: 'date', placeholder: 'DD/MM/YYYY', options: [] },
  { key: 'fecha_fin', label: 'Fecha Fin', type: 'date', placeholder: 'DD/MM/YYYY', options: [] },
  {
    key: 'id_contenedor',
    label: 'Campaña',
    type: 'select',
    placeholder: 'Seleccionar campaña',
    options: [
      { label: 'Todas', value: 'todos' },
      ...contenedoresOptions.value.map((o) => ({
        label: etiquetaConsolidadoCampania(o.label),
        value: String(o.value)
      }))
    ]
  },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    placeholder: 'Seleccionar estado',
    options: [{ label: 'Todos', value: 'todos' }, ...ESTADO_OPTIONS]
  },
  {
    key: 'id_usuario',
    label: 'Vendedor',
    type: 'select',
    placeholder: 'Seleccionar vendedor',
    options: [
      { label: 'Todos', value: 'todos' },
      ...vendedoresOptions.value.map((o) => ({ label: o.label, value: String(o.value) }))
    ]
  },
  {
    key: 'estado_china',
    label: 'China',
    type: 'select',
    placeholder: 'Seleccionar estado China',
    options: [{ label: 'Todos', value: 'todos' }, ...CHINA_OPTIONS]
  }
])

async function loadCotizaciones(page = pagination.value.current_page) {
  loading.value = true
  const idContenedor = filtroActivo(filters.id_contenedor)
  const idUsuario = filtroActivo(filters.id_usuario)
  const res = await getCotizaciones({
    search: search.value || undefined,
    fecha_inicio: filters.fecha_inicio || undefined,
    fecha_fin: filters.fecha_fin || undefined,
    estado: filtroActivo(filters.estado),
    id_contenedor: idContenedor ? Number(idContenedor) : undefined,
    id_usuario: idUsuario ? Number(idUsuario) : undefined,
    estado_china: filtroActivo(filters.estado_china),
    page,
    per_page: pagination.value.per_page
  })
  if (res.success) {
    cotizaciones.value = res.data
    headers.value = res.headers ?? {}
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
  const raw = String(value ?? '').trim()
  const isSelect =
    key === 'id_contenedor' || key === 'estado' || key === 'id_usuario' || key === 'estado_china'
  filters[key] = isSelect && (!raw || FILTER_ALL.has(raw.toLowerCase()))
    ? 'todos'
    : raw
  loadCotizaciones(1)
}

function onClearFilters() {
  filters.fecha_inicio = ''
  filters.fecha_fin = ''
  filters.id_contenedor = 'todos'
  filters.estado = 'todos'
  filters.id_usuario = 'todos'
  filters.estado_china = 'todos'
  loadCotizaciones(1)
}

function filterByNc() {
  filters.estado_china = 'NC'
  loadCotizaciones(1)
}

async function onEstadoChange(row: CotizacionResumenRow, value: string) {
  if (value === 'CONFIRMADO' && !row.id_contenedor) {
    showError('No se puede confirmar', 'Asigna un consolidado antes de confirmar la cotización.')
    return
  }
  const previo = row.estado
  showConfirmation(
    'Cambiar estado',
    value === 'CONFIRMADO'
      ? 'Al confirmar, la cotización entra al flujo de carga consolidada y se generan los códigos de proveedor que falten.'
      : 'La cotización volverá a estado COTIZADO. Los códigos de proveedor se mantienen.',
    async () => {
      row.estado = value as CotizacionResumenRow['estado']
      try {
        await withSpinner(async () => {
          const res = await updateEstado(row.id, value as 'COTIZADO' | 'CONFIRMADO')
          if (!res.success) {
            row.estado = previo
            throw new Error(res.message || 'No se pudo actualizar el estado')
          }
        }, 'Actualizando estado…')
        showSuccess('Estado actualizado', 'El estado de la cotización se actualizó.')
        await loadCotizaciones()
      } catch (e: unknown) {
        row.estado = previo
        showError('No se pudo actualizar el estado', e instanceof Error ? e.message : 'Intenta nuevamente.')
      }
    }
  )
}

function irAlConsolidado(row: CotizacionResumenRow) {
  if (!row.id_contenedor) return
  navigateTo(`/cargaconsolidada/abiertos/cotizaciones/${row.id_contenedor}?idCotizacion=${row.id}&tab=embarque`)
}

function abrirArchivo(url: string | null | undefined) {
  const href = normalizePublicFileUrl(url)
  if (!href) return
  window.open(href, '_blank', 'noopener,noreferrer')
}

function esPdfCotizacion(nombre?: string | null, url?: string | null) {
  const hay = `${nombre || ''} ${url || ''}`.toLowerCase()
  return hay.includes('.pdf')
}

function handleDocumentos(row: CotizacionResumenRow) {
  if (row.estado !== 'CONFIRMADO') return
  navigateTo({
    path: `/cargaconsolidada/abiertos/cotizaciones/documentacion/${row.id}`,
    query: { backTo: '/cotizaciones/resumen' }
  })
}

function handleEdit(row: CotizacionResumenRow) {
  if (row.estado !== 'COTIZADO') {
    showError('No se puede editar', 'Solo se puede editar una cotización en estado COTIZADO.')
    return
  }
  navigateTo(`/cotizaciones/resumen/crear?editar=${row.id}`)
}

function handleDuplicar(row: CotizacionResumenRow) {
  showConfirmation(
    'Duplicar cotización',
    'Se creará una copia en estado COTIZADO, sin consolidado. Debes asignarle un contenedor antes de confirmarla.',
    async () => {
      try {
        await withSpinner(async () => {
          const res = await duplicarCotizacion(row.id)
          if (!res.success) throw new Error(res.message || 'No se pudo duplicar')
        }, 'Duplicando…')
        showSuccess('Cotización duplicada', 'La copia quedó en COTIZADO, sin consolidado.')
        await loadCotizaciones()
      } catch (e: unknown) {
        showError('No se pudo duplicar', e instanceof Error ? e.message : 'Intenta nuevamente.')
      }
    }
  )
}

function handleDelete(row: CotizacionResumenRow) {
  if (row.estado !== 'COTIZADO') {
    showError('No se puede eliminar', 'Solo se puede eliminar una cotización en estado COTIZADO.')
    return
  }
  showConfirmation(
    'Eliminar cotización',
    `¿Eliminar la cotización de ${row.nombre || 'este contacto'}?`,
    async () => {
      try {
        await withSpinner(async () => {
          const res = await deleteCotizacion(row.id)
          if (!res.success) throw new Error(res.message || 'No se pudo eliminar')
        }, 'Eliminando…')
        showSuccess('Cotización eliminada', 'Se eliminó correctamente.')
        await loadCotizaciones()
      } catch (e: unknown) {
        showError('No se pudo eliminar', e instanceof Error ? e.message : 'Intenta nuevamente.')
      }
    }
  )
}

const columns: TableColumn<CotizacionResumenRow>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => row.index + 1
  },
  {
    accessorKey: 'fecha',
    header: 'Fecha',
    cell: ({ row }) => row.original.fecha ? formatDateTimeToDmy(row.original.fecha) : '—'
  },
  {
    accessorKey: 'contacto',
    header: 'Contacto',
    cell: ({ row }) => {
      const r = row.original
      return h('div', { class: 'flex flex-col gap-0.5 w-[11rem] max-w-[11rem] min-w-0 overflow-hidden py-2 whitespace-normal break-words' }, [
        h('span', { class: 'font-medium text-sm break-words' }, r.nombre || '—'),
        r.documento ? h('span', { class: 'text-xs text-gray-500 break-all' }, r.documento) : null,
        r.telefono ? h('span', { class: 'text-xs text-gray-500 break-all' }, r.telefono) : null,
        r.cod_cotizacion ? h('span', { class: 'text-xs text-gray-500 break-all' }, r.cod_cotizacion) : null,
        r.estado === 'CONFIRMADO' && r.cod_contract
          ? h('span', { class: 'text-xs text-gray-500 break-all' }, r.cod_contract)
          : null
      ])
    }
  },
  {
    accessorKey: 'total_cbm',
    header: 'Vol',
    cell: ({ row }) => h('div', { class: 'py-2 w-10 whitespace-nowrap' }, Number(row.original.total_cbm || 0).toFixed(2))
  },
  {
    accessorKey: 'fob',
    header: 'Fob',
    cell: ({ row }) => formatCurrency(row.original.fob || 0)
  },
  {
    accessorKey: 'isd',
    header: 'ISD',
    cell: ({ row }) => formatCurrency(row.original.isd || 0)
  },
  {
    accessorKey: 'logistica',
    header: 'Logistica',
    cell: ({ row }) => formatCurrency(row.original.logistica || 0)
  },
  {
    accessorKey: 'impuesto',
    header: 'Impuesto',
    cell: ({ row }) => formatCurrency(row.original.impuesto || 0)
  },
  {
    accessorKey: 'tarifa',
    header: 'Tarifa',
    cell: ({ row }) => formatCurrency(row.original.tarifa || 0)
  },
  {
    accessorKey: 'descuento',
    header: 'Desct.',
    cell: ({ row }) => formatCurrency(row.original.descuento || 0)
  },
  {
    accessorKey: 'campania',
    header: 'Campaña',
    cell: ({ row }) => {
      const opt = contenedoresOptions.value.find((o) => o.value === row.original.id_contenedor)
      if (opt?.label) return etiquetaConsolidadoCampania(opt.label)
      if (row.original.campania) return etiquetaConsolidadoCampania(row.original.campania)
      if (row.original.contenedor) return etiquetaConsolidadoCampania(String(row.original.contenedor))
      return '—'
    }
  },
  {
    accessorKey: 'vendedor',
    header: 'Vendedor',
    cell: ({ row }) => row.original.vendedor || '—'
  },
  {
    accessorKey: 'cotizacion',
    header: 'Cotizacion',
    cell: ({ row }) => {
      const r = row.original
      const principal = r.cotizacion_file_url || r.archivo_url
      const esPdf = esPdfCotizacion(r.archivo_nombre, principal)
      const nodos = []
      if (principal) {
        nodos.push(
          h('div', {
            innerHTML: esPdf ? CUSTOMIZED_ICONS.PDF : CUSTOMIZED_ICONS.EXCEL,
            class: 'cursor-pointer',
            title: r.archivo_nombre || (esPdf ? 'PDF' : 'Excel'),
            onClick: () => abrirArchivo(principal)
          })
        )
      }
      if (r.url_cotizacion_pdf && r.url_cotizacion_pdf !== principal) {
        nodos.push(
          h('div', {
            innerHTML: CUSTOMIZED_ICONS.PDF,
            class: 'cursor-pointer',
            title: 'PDF',
            onClick: () => abrirArchivo(r.url_cotizacion_pdf)
          })
        )
      }
      return h('div', { class: 'flex items-center gap-2' }, nodos)
    }
  },
  {
    accessorKey: 'ir_consolidado',
    header: 'Ir al consolidado',
    cell: ({ row }) => {
      if (!row.original.id_contenedor) {
        return h(UBadge as any, { label: '—', color: 'neutral', variant: 'soft', size: 'sm' })
      }
      return h(UButton, {
        color: 'primary',
        size: 'sm',
        variant: 'ghost',
        icon: 'i-heroicons-arrow-top-right-on-square',
        title: 'Ver en el consolidado',
        onClick: () => irAlConsolidado(row.original)
      })
    }
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => h(USelect as any, {
      items: ESTADO_OPTIONS,
      modelValue: row.original.estado,
      class: ['min-w-36', STATUS_BG_CLASSES[row.original.estado as keyof typeof STATUS_BG_CLASSES] || ''].join(' '),
      'onUpdate:modelValue': (value: string) => onEstadoChange(row.original, value)
    })
  },
  {
    accessorKey: 'china',
    header: 'China',
    cell: ({ row }) => h('div', { class: 'flex flex-col gap-2' },
      (row.original.proveedores || []).map((p: CotizacionResumenProveedorRow) => {
        const china = p.estado_china || 'WAIT'
        const [bg, fg] = CHINA_COLORS[china] || CHINA_COLORS.WAIT
        return h(UBadge as any, {
          style: `background:${bg};color:${fg};`,
          class: 'w-full justify-center',
          title: 'Solo Almacén China puede cambiar este estado'
        }, () => china)
      })
    )
  },
  {
    accessorKey: 'acciones',
    header: 'Acciones',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-1' }, [
      row.original.estado === 'COTIZADO'
        ? h(UButton, {
            color: 'warning',
            size: 'sm',
            variant: 'ghost',
            icon: 'i-heroicons-pencil',
            title: 'Editar',
            onClick: () => handleEdit(row.original)
          })
        : null,
      h(UButton, {
        color: 'primary',
        size: 'sm',
        variant: 'ghost',
        icon: 'i-heroicons-document-duplicate',
        title: 'Duplicar',
        onClick: () => handleDuplicar(row.original)
      }),
      row.original.estado === 'COTIZADO'
        ? h(UButton, {
            color: 'error',
            size: 'sm',
            variant: 'ghost',
            icon: 'i-heroicons-trash',
            title: 'Eliminar',
            onClick: () => handleDelete(row.original)
          })
        : null,
      row.original.estado === 'CONFIRMADO'
        ? h(UButton, {
            color: 'neutral',
            size: 'sm',
            variant: 'ghost',
            icon: 'i-heroicons-folder-open',
            title: 'Archivos',
            onClick: () => handleDocumentos(row.original)
          })
        : null
    ])
  }
]

onMounted(async () => {
  await Promise.all([loadVendedores(), loadContenedores()])
  await loadCotizaciones()
})
</script>
