<template>
  <div class="p-4">
    <DataTable
      title="Boletín Químico"
      subtitle="Gestión de ítems con boletín químico por consolidado y cliente"
      icon="i-heroicons-beaker"
      :show-title="true"
      :show-new-button="true"
      new-button-label="Nuevo"
      :on-new-button-click="openModal"
      :data="data"
      :columns="columns"
      :loading="loading"
      :current-page="pagination.current_page"
      :total-pages="pagination.last_page"
      :total-records="pagination.total"
      :items-per-page="itemsPerPage"
      :primary-search-value="search"
      :show-primary-search="true"
      primary-search-placeholder="Buscar por cliente o consolidado"
      :show-filters="false"
      :show-export="false"
      empty-state-message="No hay registros de boletín químico. Use «Nuevo» para agregar."
      :show-body-top="true"
      @update:primary-search="handleSearch"
      @page-change="handlePageChange"
      @items-per-page-change="handleItemsPerPageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useOverlay } from '#imports'
import DataTable from '~/components/DataTable.vue'
import BoletinQuimicoModal from '~/components/basedatos/BoletinQuimicoModal.vue'
import PagoGrid from '~/components/PagoGrid.vue'
import { BoletinQuimicoService } from '~/services/basedatos/boletinQuimicoService'
import type { BoletinQuimicoRow, BoletinQuimicoItem } from '~/services/basedatos/boletinQuimicoService'
import { formatCurrency } from '~/utils/formatters'
import { STATUS_BG_PAGOS_CLASSES } from '~/constants/ui'
import type { PagosDetails } from '~/types/cargaconsolidada/clientes/pagos'

definePageMeta({ layout: 'default' })

const data = ref<BoletinQuimicoRow[]>([])
const loading = ref(false)
const search = ref('')
const itemsPerPage = ref(50)
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 50,
  total: 0,
  from: 0,
  to: 0
})
const overlay = useOverlay()
const boletinModal = overlay.create(BoletinQuimicoModal)

async function load () {
  loading.value = true
  try {
    const res = await BoletinQuimicoService.getList({
      page: pagination.value.current_page,
      per_page: itemsPerPage.value,
      search: search.value || undefined
    })
    if (res.success) {
      data.value = res.data
      pagination.value = res.pagination
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function handleSearch (v: string) {
  search.value = v
  pagination.value.current_page = 1
  load()
}

function handlePageChange (page: number) {
  pagination.value.current_page = page
  load()
}

function handleItemsPerPageChange (per: number) {
  itemsPerPage.value = per
  pagination.value.current_page = 1
  load()
}

function openModal () {
  boletinModal.open({
    onClose: () => {},
    onSaved: () => { load() }
  } as any)
}

function buildFormAndStorePago (item: BoletinQuimicoItem, pagoData: any) {
  const form = new FormData()
  form.append('id_boletin_quimico_item', String(item.id))
  form.append('monto', String(pagoData.monto))
  const banco = Array.isArray(pagoData.banco) ? pagoData.banco[0] : pagoData.banco
  if (banco) form.append('banco', banco)
  const fd = pagoData.fecha
  const fechaStr = fd && typeof fd === 'object' && fd !== null && 'year' in fd
    ? `${(fd as any).year}-${String((fd as any).month).padStart(2, '0')}-${String((fd as any).day).padStart(2, '0')}`
    : (typeof fd === 'string' ? fd : '')
  form.append('fecha', fechaStr)
  if (pagoData.voucher instanceof File) form.append('voucher', pagoData.voucher)
  BoletinQuimicoService.storePago(form).then(() => load())
}

/** Cuatro estados. Verde solo cuando estado es pagado Y todos los pagos están confirmados; si no, gris. */
function estadoSelectClass (estado: string, item?: { pagos_details?: { status: string }[] }) {
  const pagos = item?.pagos_details || []
  const allConfirmados = pagos.length > 0 && pagos.every((p) => p.status === 'CONFIRMADO')
  if (estado === 'pagado') return allConfirmados ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-200 dark:border-green-800' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'
  if (estado === 'pagado_gris') return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'
  if (estado === 'adelanto_pagado') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border-amber-200 dark:border-amber-800'
  return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
}

function estadoLabel (estado: string) {
  if (estado === 'pagado') return 'Pagado'
  if (estado === 'pagado_gris') return 'Pagado'
  if (estado === 'adelanto_pagado') return 'Adelanto'
  return 'Pendiente'
}

const ESTADO_OPTIONS = [
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'Adelanto', value: 'adelanto_pagado' },
  { label: 'Pagado (gris)', value: 'pagado_gris' },
  { label: 'Pagado', value: 'pagado' }
]

const USelect = resolveComponent('USelect')
const columns = computed<TableColumn<BoletinQuimicoRow>[]>(() => [
  {
    accessorKey: 'cliente',
    header: 'Cliente',
    cell: ({ row }) => h('span', row.original.cliente)
  },
  {
    accessorKey: 'consolidado',
    header: 'Consolidado',
    cell: ({ row }) => h('span', row.original.consolidado)
  },
  {
    accessorKey: 'items',
    header: 'Items',
    cell: ({ row }) => {
      const items = row.original.items || []
      const lines = items.map((i) => h('div', { class: 'text-sm', key: i.id }, i.item_nombre))
      return h('div', { class: 'flex flex-col gap-1' }, lines.length ? lines : '—')
    }
  },
  {
    accessorKey: 'monto_boletin',
    header: 'Monto',
    cell: ({ row }) => {
      const items = row.original.items || []
      const lines = items.map((i) => h('div', { class: 'text-sm', key: i.id }, formatCurrency(i.monto_boletin, 'PEN')))
      return h('div', { class: 'flex flex-col gap-1' }, lines.length ? lines : '—')
    }
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const items = row.original.items || []
      const selects = items.map((it) => h(USelect as any, {
        key: it.id,
        modelValue: it.estado,
        items: ESTADO_OPTIONS,
        valueAttribute: 'value',
        disabled: true,
        variant: 'subtle',
        class: `text-sm py-1.5 px-2 rounded-md border w-full min-w-[120px] ${estadoSelectClass(it.estado, it)}`
      }))
      return h('div', { class: 'flex flex-col gap-1' }, selects.length ? selects : '—')
    }
  },
  {
    accessorKey: 'adelantos',
    header: 'Adelantos',
    cell: ({ row }) => {
      const r = row.original
      const items = r.items || []
      return h('div', { class: 'flex flex-col ' }, items.map((item) => {
        const details: PagosDetails[] = (item.pagos_details || []).map((p: any) => ({
          id_pago: p.id_pago,
          monto: String(p.monto),
          status: p.status,
          concepto: typeof p.concepto === 'object' ? p.concepto?.name : p.concepto,
          payment_date: p.payment_date || '',
          banco: p.banco || '',
          voucher_url: p.voucher_url || ''
        }))
        return h(PagoGrid, {
          key: item.id,
          numberOfPagos: Math.max(1, details.length + 1),
          pagoDetails: details,
          clienteNombre: r.cliente,
          currency: 'PEN',
          showDelete: false,
          onSave: (data: any) => buildFormAndStorePago(item, data)
        })
      }))
    }
  }
])

onMounted(() => {
  load()
})

</script>
