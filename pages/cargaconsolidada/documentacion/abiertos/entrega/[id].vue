<template>
  <div class="md:p-6">
    <DataTable v-if="activeTab === 'clientes'" title="" :data="clientes" :columns="clientesColumns" :loading="loading"
      icon="" :show-pagination="false" :current-page="currentPage" :total-pages="totalPages"
      :total-records="totalRecords" :items-per-page="itemsPerPage" :search-query-value="search"
      :show-secondary-search="false" :show-filters="true" :filter-config="clientesFilterConfig" :show-export="true"
    empty-state-message="No se encontraron registros de entrega." @update:primary-search="handleClientesSearch"
    @page-change="handleClientesPageChange" @items-per-page-change="handleClientesItemsPerPageChange"
    @filter-change="handleClientesFilterChange" @clear-filters="onClearClientesFilters"
    @export="handleExportClientesExcel"
    :hide-back-button="false" :show-primary-search="true" :show-body-top="true"
  :previous-page-url="`/cargaconsolidada/documentacion/abiertos/pasos/${id}`">
      <template #actions>
        <UButton label="Fechas y Horarios" color="primary" variant="solid" class="py-3 hidden md:flex" icon="i-heroicons-calendar"
          @click="navigateTo(`/cargaconsolidada/documentacion/abiertos/entrega/fechas-horarios/${id}`)" />
      </template>
      <template #body-top>
        <div class="flex flex-col gap-2">
          <div class="flex md:items-center items-start gap-3 ">
            <SectionHeader :title="`Entregas #${carga}`" :headers="headers" :loading="loadingHeaders" />
            <div class="flex gap-2 items-center">
              <UButton size="lg" color="primary" variant="outline" icon="i-heroicons-clipboard-document" @click="copyToClipboard(linkLima, 'Lima')">
                <span class="hidden md:inline">Formulario Lima</span>
                <span class="inline md:hidden">Lima</span>
              </UButton>
              <UButton size="lg" color="warning" variant="outline" icon="i-heroicons-clipboard-document" @click="copyToClipboard(linkProvincia, 'Provincia')">
                <span class="hidden md:inline">Formulario Provincia</span>
                <span class="inline md:hidden">Provincia</span>
              </UButton>
              <transition name="fade">
                <span v-if="copiedLima || copiedProvincia" class="text-green-600 font-medium text-sm hidden md:inline">¡Copiado!</span>
              </transition>
            </div>
          </div>
          <UTabs v-model="activeTab" :items="tabs" color="neutral" variant="pill" class="mb-1 w-80 h-15" />
        </div>
        <div class="flex-col gap-2 hidden md:flex">
          <div class="flex items-center gap-2">
              <UButton
              size="md"
              color="neutral"
              variant="outline"
              icon="ic:baseline-download"
              :disabled="!carga"
              label="Descargar Plantillas"
              @click="async (e) => { await downloadPlantillas(); }"
            />
          </div>
        </div>
      </template>
      <template #back-extra>
        <UButton label="Fechas y Horarios" color="primary" variant="solid" class="py-3 md:hidden flex" icon="i-heroicons-calendar"
          @click="navigateTo(`/cargaconsolidada/documentacion/abiertos/entrega/fechas-horarios/${id}`)" />
      </template>
    </DataTable>
    <DataTable v-if="activeTab === 'entregas'" title="" :data="entregas" :columns="entregasColumns" :loading="loading"
      icon="" :show-pagination="false" :current-page="currentPage" :total-pages="totalPages"
      :total-records="totalRecords" :items-per-page="itemsPerPage" :search-query-value="search"
      :show-secondary-search="false" :show-filters="true" :filter-config="filterConfig" :show-export="false"
      :table-meta="tableMeta"
      empty-state-message="No se encontraron registros de entrega." @update:primary-search="handleSearch"
      @page-change="handlePageChange" @items-per-page-change="handleItemsPerPageChange"
      @filter-change="handleFilterChange" :hide-back-button="false" :show-primary-search="true" :show-body-top="true"
      
  :previous-page-url="`/cargaconsolidada/documentacion/abiertos/pasos/${id}`">
      <template #body-top>
        <div class="flex flex-col gap-2">
          <div class="flex md:items-center items-start gap-3 flex-col md:flex-row">
            <SectionHeader :title="`Entregas #${carga}`" :headers="headersEntregas" :loading="loadingHeaders" />
            <div class="flex gap-2 items-center">
              <UButton size="lg" color="primary" variant="outline" icon="i-heroicons-clipboard-document" @click="copyToClipboard(linkLima, 'Lima')">
                <span class="hidden md:inline">Formulario Lima</span>
                <span class="inline md:hidden">Lima</span>
              </UButton>
              <UButton size="lg" color="warning" variant="outline" icon="i-heroicons-clipboard-document" @click="copyToClipboard(linkProvincia, 'Provincia')">
                <span class="hidden md:inline">Formulario Provincia</span>
                <span class="inline md:hidden">Provincia</span>
              </UButton>
              <transition name="fade">
                <span v-if="copiedLima || copiedProvincia" class="text-green-600 font-medium text-sm">¡Copiado!</span>
              </transition>
            </div>
          </div>
          <UTabs v-model="activeTab" :items="tabs" color="neutral" variant="pill" class="mb-1 w-80 h-15" />
        </div>
      </template>
    </DataTable>
    <DataTable v-if="activeTab === 'delivery'" title="" :data="delivery" :columns="deliveryColumns" :loading="loading"
      icon="" :show-pagination="false" :hide-back-button="false" :show-primary-search="false" :show-body-top="true"
  :previous-page-url="`/cargaconsolidada/documentacion/abiertos/pasos/${id}`">
      <template #body-top>
        <div class="flex flex-col gap-2">
          <div class="flex md:items-center items-start gap-3 flex-col md:flex-row">
            <SectionHeader :title="`Delivery #${carga}`" :headers="headersDelivery" :loading="loadingHeaders" />
            <div class="flex gap-2 items-center">
              <UButton size="lg" color="primary" variant="outline" icon="i-heroicons-clipboard-document" @click="copyToClipboard(linkLima, 'Lima')">
                <span class="hidden md:inline">Formulario Lima</span>
                <span class="inline md:hidden">Lima</span>
              </UButton>
              <UButton size="lg" color="warning" variant="outline" icon="i-heroicons-clipboard-document" @click="copyToClipboard(linkProvincia, 'Provincia')">
                <span class="hidden md:inline">Formulario Provincia</span>
                <span class="inline md:hidden">Provincia</span>
              </UButton>
              <transition name="fade">
                <span v-if="copiedLima || copiedProvincia" class="text-green-600 font-medium text-sm">¡Copiado!</span>
              </transition>
            </div>
          </div>
          <UTabs v-model="activeTab" :items="tabs" color="neutral" variant="pill" class="mb-1 w-80 h-15" />
          <div class="text-xs text-gray-500">Gestiona importes y adelantos. Cambia el importe manualmente y registra
            adelantos con los botones.</div>
        </div>
      </template>
    </DataTable>
    
    <!-- Modal de acciones de delivery -->
    <DeliveryAccionesModal
      v-if="selectedRowForModal"
      v-model="showAccionesModal"
      :id-cotizacion="selectedRowForModal.id_cotizacion || selectedRowForModal.id"
      :cliente-nombre="selectedRowForModal.nombre || ''"
      @close="closeAccionesModal"
      @success="handleAccionesModalSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import SectionHeader from '~/components/commons/SectionHeader.vue'
import { useEntrega } from '~/composables/cargaconsolidada/entrega/useEntrega'
import { useUserRole } from '~/composables/auth/useUserRole'
import { UBadge, UButton, UInput, UTabs, USelect } from '#components'
import PagoGrid from '~/components/PagoGrid.vue'
import DeliveryAccionesModal from '~/components/cargaconsolidada/entrega/DeliveryAccionesModal.vue'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { ROLES } from '~/constants/roles'
import { STATUS_BG_CLASSES } from '~/constants/ui'
import type { TableRow } from '@nuxt/ui'

const route = useRoute()
const id = Number(route.params.id)
const { currentRole, currentId } = useUserRole()
const { showConfirmation, showSuccess, showError } = useModal()
const { withSpinner } = useSpinner()
const overlay = useOverlay()
const modalAcciones = overlay.create(DeliveryAccionesModal)
const {
  entregas,
  clientes,
  loading,
  error,
  pagination,
  search,
  itemsPerPage,
  totalPages,
  totalRecords,
  currentPage,
  filters,
  filterConfig,
  getEntregas,
  getClientes,
  clientesFilterConfig,
  marcarRegistrado,
  marcarEntregadoCliente,
  handleSearch,
  handlePageChange,
  handleItemsPerPageChange,
  handleFilterChange,
  handleClientesSearch,
  handleClientesFilterChange,
  handleClientesPageChange,
  handleClientesItemsPerPageChange,
  clearClientesFilters,
  downloadPlantillas,
  exportClientesExcel,
  clearFilters,
  headers,
  headersEntregas,
  headersDelivery,
  carga,
  loadingHeaders,
  getHeaders,
  // delivery
  delivery,
  getDelivery,
  updateImporteDelivery,
  updateServicioDelivery,
  registrarPagoDelivery,
  deletePagoDelivery,
  sendMessageForCotizacion,
  deleteEntregaRegistro,
  sendCobroDeliveryDelivery
} = useEntrega()

const routeQuery = useRoute()
const initialTab = (routeQuery.query.tab as string) || 'clientes'
const activeTab = ref(initialTab)
const tabs = [
  { value: 'clientes', label: 'Clientes' },
  { value: 'entregas', label: 'Entregas' },
  { value: 'delivery', label: 'Delivery' }
]
const handleTabChange = (value: string) => {
  if (value === 'clientes') {
    getClientes(id)
  } else if (value === 'entregas') {
    getEntregas(id)
  } else if (value === 'delivery') {
    getDelivery(id)
  }
}
const tableMeta = {
  class: {
    tr: (row: TableRow<{ value: number }>) => {
      return row.original.isVerified ? "bg-green-500" : "bg-white dark:bg-gray-800";
    },
  },
};
// Links externos por contenedor (usa el id del contenedor)
const linkLima = computed(() => `https://clientes.probusiness.pe/formulario-entrega/lima/${id}`)
const linkProvincia = computed(() => `https://clientes.probusiness.pe/formulario-entrega/provincia/${id}`)

// abiertos para mostrar mensaje de copiado
const copiedLima = ref(false)
const copiedProvincia = ref(false)
const handleCobroMessage = async (row: any) => {
  await withSpinner(async () => {
    const response = await sendCobroDeliveryDelivery(row.id_cotizacion || row.id, 'Cobro de delivery')
    if (response?.success) {
      showSuccess('Cobro enviado', 'Cobro enviado correctamente')
    } else {
      showError('Error', response?.error || 'No se pudo enviar el cobro')
    }
  }, 'Enviando cobro...')
}
const handleExportClientesExcel = async () => {
  const result = await exportClientesExcel(id)
  if (result?.success) {
    showSuccess('Exportar', 'Excel descargado correctamente')
  } else {
    showError('Error', (result as any)?.error || 'No se pudo exportar el Excel')
  }
}

const copyToClipboard = async (url: string, type: string) => {
  try {
    await navigator.clipboard.writeText(url)
    
    // Mostrar mensaje de copiado
    if (type === 'Lima') {
      copiedLima.value = true
      setTimeout(() => copiedLima.value = false, 2000)
    } else {
      copiedProvincia.value = true
      setTimeout(() => copiedProvincia.value = false, 2000)
    }
  } catch (err) {
    console.error('Error al copiar URL:', err)
    // Fallback para navegadores que no soportan clipboard API
    const textArea = document.createElement('textarea')
    textArea.value = url
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    
    // Mostrar mensaje de copiado
    if (type === 'Lima') {
      copiedLima.value = true
      setTimeout(() => copiedLima.value = false, 2000)
    } else {
      copiedProvincia.value = true
      setTimeout(() => copiedProvincia.value = false, 2000)
    }
  }
}
const clientesColumns = ref<TableColumn<any>[]>([
  {
    accessorKey: 'nro',
    header: 'N.',
    cell: ({ row }) => row.index + 1
  },
    {
      accessorKey: 'contacto',
      header: 'Contacto',
      cell: ({ row }) => {
        const nombre = row.original?.nombre || ''
        const documento = row.original?.documento || ''
        const telefono = row.original?.telefono || ''
        const correo = row.original?.correo || ''
        return h('div', { class: 'py-1' }, [
          h('div', { class: 'font-medium' }, nombre?.toUpperCase?.() || nombre),
          h('div', { class: 'text-sm text-gray-500' }, documento),
          h('div', { class: 'text-sm text-gray-500' }, telefono),
          h('div', { class: 'text-sm text-gray-500' }, correo || '')
        ])
      }
    },
  {
    accessorKey: 'name',
    header: 'T. Cliente',
    cell: ({ row }) => row.original.name || '—'
  },
  {
    accessorKey: 'type_form',
    header: 'T. Entrega',
    cell: ({ row }) => {
      const tf = row.original.type_form
      const label = (tf === 0 || tf === '0')
        ? 'Provincia'
        : (tf === 1 || tf === '1')
          ? 'Lima'
          : '-'
      const color = label === 'Lima' ? 'primary' : label === 'Provincia' ? 'warning' : 'neutral'
      return h(UBadge, { label, color, variant: 'soft' })
    }
  },
  {
    accessorKey: 'origen',  
    header: 'Origen',
    cell: ({ row }) => row.original.origen || '—'
  },
  {
    accessorKey: 'registrado',
    header: 'Registrado',
    cell: ({ row }) => h(UBadge, { label: row.original.delivery_form_registered_at ? 'Si' : 'No', color: row.original.delivery_form_registered_at ? 'success' : 'error' })
  },
  {
    accessorKey: 'entregado',
    header: 'Entregado',
    cell: ({ row }) => h(UBadge, { label: row.original.conformidad_count ? 'Si' : 'No', color: row.original.conformidad_count ? 'success' : 'error' })
  },
  {
    accessorKey: 'estado_cotizacion_final',
    header: 'Cotizacion Final',
    cell: ({ row }) => {
      // Manejar pagos_details que puede ser null, string JSON o array
      let pagosDetails: any[] = []
      if (row.original.pagos_details) {
        if (typeof row.original.pagos_details === 'string') {
          try {
            pagosDetails = JSON.parse(row.original.pagos_details)
          } catch (e) {
            pagosDetails = []
          }
        } else if (Array.isArray(row.original.pagos_details)) {
          pagosDetails = row.original.pagos_details
        }
      }

      // Si pagos_details es null o empty, mostrar Pendiente
      if (!pagosDetails || pagosDetails.length === 0) {
        const className = 'bg-gray-500 text-white dark:bg-gray-500 dark:text-white'
        return h(USelect as any, {
          modelValue: 'Pendiente',
          disabled: true,
          items: [
            { label: 'Pendiente', value: 'Pendiente' },
            { label: 'Pagado', value: 'Pagado' }
          ],
          class: className
        })
      }

      // Calcular total de pagos confirmados
      const totalPagosConfirmados = pagosDetails
        .filter((pago: any) => pago.status === 'CONFIRMADO')
        .reduce((sum: number, pago: any) => sum + Number(pago.monto ?? 0), 0)

      // Calcular total de todos los pagos (confirmados y no confirmados)
      const totalPagos = pagosDetails
        .reduce((sum: number, pago: any) => sum + Number(pago.monto ?? 0), 0)

      // Verificar si todos los pagos están confirmados
      const todosConfirmados = pagosDetails.every((pago: any) => pago.status === 'CONFIRMADO')

      const totalLogImp = Number(row.original.total_logistica_impuestos ?? 0)

      // Si logistica_impuestos es 0, mostrar Pendiente
      if (totalLogImp === 0) {
        const className = 'bg-gray-500 text-white dark:bg-gray-500 dark:text-white'
        return h(USelect as any, {
          modelValue: 'Pendiente',
          disabled: true,
          items: [
            { label: 'Pendiente', value: 'Pendiente' },
            { label: 'Pagado', value: 'Pagado' }
          ],
          class: className
        })
      }

      // Si total_pagos >= total_logistica_impuestos pero no todos están confirmados, mostrar Pagado con fondo blanco
      if (totalPagos >= totalLogImp && !todosConfirmados) {
        return h(USelect as any, {
          modelValue: 'Pagado',
          disabled: true,
          items: [
            { label: 'Pendiente', value: 'Pendiente' },
            { label: 'Pagado', value: 'Pagado' }
          ],
          class: 'bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600'
        })
      }

      // Si total_pagos_confirmados >= total_logistica_impuestos y todos están confirmados, mostrar Pagado con fondo verde
      const isPagado = totalPagosConfirmados >= totalLogImp && totalLogImp > 0 && todosConfirmados
      const estado = isPagado ? 'Pagado' : 'Pendiente'
      
      // Aplicar la misma lógica de colores que en cotizacion-final
      const isPagadoVerificado = estado === 'Pagado' && todosConfirmados
      const isPendiente = estado === 'Pendiente'
      
      const className = isPagadoVerificado
        ? 'bg-green-500 text-white dark:bg-green-500 dark:text-white'
        : isPendiente
          ? 'bg-gray-500 text-white dark:bg-gray-500 dark:text-white'
          : STATUS_BG_CLASSES[estado as keyof typeof STATUS_BG_CLASSES] || 'bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600'

      return h(USelect as any, {
        modelValue: estado,
        disabled: true,
        items: [
          { label: 'Pendiente', value: 'Pendiente' },
          { label: 'Pagado', value: 'Pagado' }
        ],
        class: className
      })
    }
  },
  {
    accessorKey: 'delivery',
    header: 'Delivery',
    cell: ({ row }) => {
      // Manejar pagos_details_delivery que puede ser null, string JSON o array
      let pagosDetailsDelivery: any[] = []
      if (row.original.pagos_details_delivery) {
        if (typeof row.original.pagos_details_delivery === 'string') {
          try {
            pagosDetailsDelivery = JSON.parse(row.original.pagos_details_delivery)
          } catch (e) {
            pagosDetailsDelivery = []
          }
        } else if (Array.isArray(row.original.pagos_details_delivery)) {
          pagosDetailsDelivery = row.original.pagos_details_delivery
        }
      }

      const totalPagoDelivery = Number(row.original.total_pago_delivery ?? 0)

      // 1. "No tiene": cuando no hay importe en la sección de delivery
      if (totalPagoDelivery === 0 || !totalPagoDelivery) {
        return h(USelect as any, {
          modelValue: 'No tiene',
          disabled: true,
          items: [
            { label: 'No tiene', value: 'No tiene' },
            { label: 'Pendiente', value: 'Pendiente' },
            { label: 'Pagado', value: 'Pagado' }
          ],
          class: 'bg-gray-500 text-white dark:bg-gray-500 dark:text-white'
        })
      }

      // Si no hay pagos, mostrar Pendiente
      if (!pagosDetailsDelivery || pagosDetailsDelivery.length === 0) {
        return h(USelect as any, {
          modelValue: 'Pendiente',
          disabled: true,
          items: [
            { label: 'No tiene', value: 'No tiene' },
            { label: 'Pendiente', value: 'Pendiente' },
            { label: 'Pagado', value: 'Pagado' }
          ],
          class: 'bg-gray-500 text-white dark:bg-gray-500 dark:text-white'
        })
      }

      // Calcular total de pagos confirmados
      const totalPagosConfirmados = pagosDetailsDelivery
        .filter((pago: any) => pago.status === 'CONFIRMADO')
        .reduce((sum: number, pago: any) => sum + Number(pago.monto ?? 0), 0)

      // Calcular total de todos los pagos (confirmados y no confirmados)
      const totalPagos = pagosDetailsDelivery
        .reduce((sum: number, pago: any) => sum + Number(pago.monto ?? 0), 0)

      // Verificar si todos los pagos están confirmados
      const todosConfirmados = pagosDetailsDelivery.every((pago: any) => pago.status === 'CONFIRMADO')

      // 2. "Pendiente": cuando tiene un importe por pagar pero no se ha cubierto
      if (totalPagos < totalPagoDelivery) {
        return h(USelect as any, {
          modelValue: 'Pendiente',
          disabled: true,
          items: [
            { label: 'No tiene', value: 'No tiene' },
            { label: 'Pendiente', value: 'Pendiente' },
            { label: 'Pagado', value: 'Pagado' }
          ],
          class: 'bg-gray-500 text-white dark:bg-gray-500 dark:text-white'
        })
      }

      // 3. "Pagado (blanco)": cuando coordinación subió un pago pero Patricia aún no confirma
      if (totalPagos >= totalPagoDelivery && !todosConfirmados) {
        return h(USelect as any, {
          modelValue: 'Pagado',
          disabled: true,
          items: [
            { label: 'No tiene', value: 'No tiene' },
            { label: 'Pendiente', value: 'Pendiente' },
            { label: 'Pagado', value: 'Pagado' }
          ],
          class: 'bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600'
        })
      }

      // 4. "Pagado (verde)": cuando coordinación subió un pago y Patricia confirmó
      const isPagadoVerificado = totalPagosConfirmados >= totalPagoDelivery && todosConfirmados
      const estado = isPagadoVerificado ? 'Pagado' : 'Pendiente'
      
      const className = isPagadoVerificado
        ? 'bg-green-500 text-white dark:bg-green-500 dark:text-white'
        : 'bg-gray-500 text-white dark:bg-gray-500 dark:text-white'

      return h(USelect as any, {
        modelValue: estado,
        disabled: true,
        items: [
          { label: 'No tiene', value: 'No tiene' },
          { label: 'Pendiente', value: 'Pendiente' },
          { label: 'Pagado', value: 'Pagado' }
        ],
        class: className
      })
    }
  },
  {
    id: 'actions',
    header: 'Accion',
    cell: ({ row }) => h('div', { class: 'flex gap-2' }, [
      //replace with hamburger
      h(UButton, {
        size: 'xs',
        icon: 'iconamoon:menu-burger-horizontal',
        variant: 'ghost', color: 'neutral',
        title: 'Acciones', onClick: () => openAccionesModal(row.original)
      })
    ])
  }
])
// Columnas actualizadas para Entregas (abiertos) – mismas que en 'abiertos'
const entregasColumns = ref<TableColumn<any>[]>([
  { accessorKey: 'nro', header: 'N', cell: ({ row }) => row.index + 1 },
    { accessorKey: 'contacto', header: 'Contacto', cell: ({ row }) => {
        const nombre = row.original?.nombre || ''
        const documento = row.original?.documento || ''
        const telefono = row.original?.telefono || ''
        const correo = row.original?.correo || ''
        return h('div', { class: '' }, [
          h('div', { class: 'font-medium' }, nombre || row.original.razon_social || '—'),
          h('div', { class: 'text-sm text-gray-500' }, documento || ''),
          h('div', { class: 'text-sm text-gray-500' }, telefono || '—'),
          h('div', { class: 'text-sm text-gray-500' }, correo || '')
        ])
      } },
  { accessorKey: 'cbm', header: 'Cbm', cell: ({ row }) => {
      const toNum = (v: any) => {
        const n = Number(v)
        return Number.isFinite(n) ? n : null
      }
      const cbmChina = toNum(row.original.sum_cbm_china)
      const cbmTotal = toNum(row.original.sum_cbm_total)
      let value: number | string | null = null
      if (cbmChina !== null && cbmTotal !== null) value = cbmTotal > cbmChina ? cbmTotal : cbmChina
      else if (cbmChina !== null) value = cbmChina
      else if (cbmTotal !== null) value = cbmTotal
      else value = row.original.cbm_total_china ?? row.original.cbm ?? '—'
      return value ?? '—'
    } },
  { accessorKey: 'bultos', header: 'Bultos', cell: ({ row }) => row.original.qty_box_china ?? '—' },
  {
    accessorKey: 'tipo_entrega', header: 'Envio', cell: ({ row }) => {
      const tf = row.original.type_form
      const label = (tf === 0 || tf === '0')
        ? 'Provincia'
        : (tf === 1 || tf === '1')
          ? 'Lima'
          : '-'
      const color = label === 'Lima' ? 'success' : label === 'Provincia' ? 'primary' : 'neutral'
      return h(UBadge, { label, color, variant: 'soft' })
    }
  },

  { accessorKey: 'ciudad', header: 'Ciudad', cell: ({ row }) => row.original.department_name || 'Lima' },
  { accessorKey: 'documento', header: 'Ruc o Dni', cell: ({ row }) => row.original.agency_ruc || row.original.pick_doc || '—' },
  { accessorKey: 'razon_social', header: 'Razon social o Nombre', cell: ({ row }) => row.original.agency_name || row.original.pick_name || '—' },
  {
    accessorKey: 'fecha_programada', header: 'Fecha', cell: ({ row }) => {
      const tf = row.original?.type_form
      const isLima = (tf === 1 || tf === '1')
      if (isLima) {
        const fp = formatDateTimeToDmy(row.original.delivery_date)
        if (!fp) return '—'
        const date = fp.includes(' ') ? fp.split(' ')[0] : fp.split('T')[0]
        return date || '—'
      }
      // Provincia: usar fecha_creacion_formulario si existe, si no fallback a created_at
      const fcRaw = row.original.fecha_creacion_formulario ?? row.original.created_at ?? row.original.form_created_at ?? row.original.createdAt
      const fc = formatDateTimeToDmy(fcRaw)
      if (!fc) return '—'
      const dateProv = fc.includes(' ') ? fc.split(' ')[0] : fc.split('T')[0]
      return dateProv || '—'
    }
  },
  {
    id: 'hora_programada', header: 'Hora', cell: ({ row }) => {
      // Preferir tiempos dedicados en formato HH:MM:SS y formatear a HH:MM
      const start = row.original.delivery_start_time
      const end = row.original.delivery_end_time
      const fmt = (t: any) => {
        if (!t || typeof t !== 'string') return null
        const parts = t.split(':')
        if (parts.length >= 2) {
          const hh = (parts[0] ?? '').padStart(2, '0')
          const mm = (parts[1] ?? '').padStart(2, '0')
          return `${hh}:${mm}`
        }
        return t
      }
      const s = fmt(start)
      const e = fmt(end)
      if (s && e) return `${s} - ${e}`
      if (s) return s
      // Fallback: intentar extraer HH:MM desde fecha_programada
      const fp = row.original.fecha_programada
      if (!fp || typeof fp !== 'string') return '—'
      if (fp.includes(' ')) return (fp.split(' ')[1] || '').substring(0, 5) || '—'
      if (fp.includes('T')) return (fp.split('T')[1] || '').substring(0, 5) || '—'
      return '—'
    }
  },
  {
    id: 'estado', header: 'Entregado', cell: ({ row }) => {
      const estado = row.original.estado_entrega || (row.original.conformidad_count ? 'ENTREGADO' : 'PENDIENTE')
      const color = estado === 'ENTREGADO' ? 'success' : estado === 'PROGRAMADA' ? 'warning' : 'neutral'
      return h(UBadge, { label: estado, color, variant: 'soft' })
    }
  },
  {
    id: 'accion', header: 'Accion', cell: ({ row }) => h('div', { class: 'flex gap-2' }, [
      h(UButton, { size: 'xs', icon: 'i-heroicons-eye', variant: 'ghost', color: 'neutral', 'aria-label': 'Ver detalle', title: 'Ver detalle', onClick: async () => goToClienteDetalle(row.original) }),
      h(UButton, { size: 'xs', icon: 'i-heroicons-trash', variant: 'ghost', color: 'error', 'aria-label': 'Eliminar registro', title: 'Eliminar registro', onClick: () => handleEliminarRegistro(row.original) })
    ])
  }
])

const goToClienteDetalle = (data: any) => {
  // Puede venir el objeto completo (row.original) o sólo el id
  const cid = typeof data === 'number'
    ? data
    : data?.id_cotizacion || data?.id
  if (!cid) {
    console.warn('ID cotización no disponible para navegación detalle')
    return
  }
  // Solo navegamos con el id de la cotización; el detalle obtendrá el id_contenedor desde la propia data.
  navigateTo(`/cargaconsolidada/documentacion/abiertos/entrega/clientes/${cid}`)
}
const handleEnviarMensaje = (id_cotizacion: number) => {
  showConfirmation(
    'Confirmar envío',
    '¿Deseas enviar el mensaje al cliente ahora?',
    () => {
      try {
        withSpinner(async () => {
          const response = await sendMessageForCotizacion(id_cotizacion)
          if (response?.success) {
            showSuccess('Mensaje enviado', 'Mensaje enviado correctamente')
          } else {
            showError('Error', response?.error || 'No se pudo enviar el mensaje')
          }
        }, 'Enviando mensaje...')
      } catch (error) {
        showError('Error', (error as any)?.message || String(error))
      }
    },
    () => {}
  )
}
const handleEliminarRegistro = (row: any) => {
  const registroId = row?.id_cotizacion || row?.id
  if (!registroId) return
  showConfirmation('Confirmar eliminación', '¿Está seguro de eliminar este registro de entrega?', () => {
    withSpinner(async () => {
      try {
        const res = await deleteEntregaRegistro(registroId)
        if (res?.success) {
          showSuccess('Eliminado', 'El registro de entrega fue eliminado correctamente')
          await getEntregas(id)
        } else {
          showError('Error', res?.error || 'No se pudo eliminar el registro')
        }
      } catch (e: any) {
        showError('Error', e?.message || 'No se pudo eliminar el registro')
      }
    }, 'Eliminando...')
  })
}

onMounted(async () => {
  handleTabChange(tabs[0].value)
})

watch(activeTab, async (newVal) => {
  if (newVal && newVal !== '') {
    try {
      if (newVal === 'clientes') {
        try { search.value = '' } catch (e) { /* ignore */ }
        await getClientes(id)
      } else if (newVal === 'entregas') {
        try { search.value = '' } catch (e) { /* ignore */ }
        await getEntregas(id)
      } else if (newVal === 'delivery') {
        try { search.value = '' } catch (e) { /* ignore */ }
        await getEntregas(id)
        getDelivery(id)
      }
      await getHeaders(Number(id))
    } catch (error) {
      console.error('Error al cambiar de pestaña:', error)
    }
  }
}, { immediate: true })

// Wrappers UI para pagos usando funciones del composable
const handleRegistrarPago = (row: any, data: any) => {
  withSpinner(async () => {
    const response = await registrarPagoDelivery(row, data)
    if (response?.success) {
      showSuccess('Pago registrado', 'Pago registrado correctamente', { duration: 3000 })
    } else {
      showError('Error', response?.error || 'No se pudo registrar el pago')
    }
  }, 'registrarPago')
}
const handleDeletePago = (row: any, pagoId: number) => {
  showConfirmation('Confirmar eliminación', '¿Está seguro de eliminar el pago?', () => {
    withSpinner(async () => {
      const response = await deletePagoDelivery(row, pagoId)
      if (response?.success) {
        showSuccess('Pago eliminado', 'Se eliminó el pago correctamente')
      } else {
        showError('Error', response?.error || 'No se pudo eliminar el pago')
      }
    }, 'Eliminando pago...')
  })
}

// Clear filters from DataTable panel
const onClearClientesFilters = () => {
  clearClientesFilters()
}
const deliveryColumns = ref<TableColumn<any>[]>([
  { accessorKey: 'nro', header: 'N', cell: ({ row }) => row.index + 1 },
  { accessorKey: 'contacto', header: 'Contacto', cell: ({ row }) => {
      const nombre = row.original?.nombre || ''
      const documento = row.original?.documento || ''
      const telefono = row.original?.telefono || ''
      const correo = row.original?.correo || ''
      return h('div', {}, [
        h('div', { class: 'font-medium' }, nombre || '—'),
        h('div', { class: 'text-sm text-gray-500' }, documento || ''),
        h('div', { class: 'text-sm text-gray-500' }, telefono || '—'),
        h('div', { class: 'text-sm text-gray-500' }, correo || '')
      ])
    } },
  {
    accessorKey: 'entrega', header: 'Entrega', cell: ({ row }) => {
      return h(UBadge, {
        label: row.original.entrega || '—',
        color: row.original.entrega === 'LIMA' ? 'success' : row.original.entrega === 'PROVINCIA' ? 'primary' : 'neutral',
        variant: 'soft'
      })
    }
  },
  { accessorKey: 'ciudad', header: 'Ciudad', cell: ({ row }) => row.original.ciudad || '—' },
  { accessorKey: 'documento', header: 'Ruc o Dni', cell: ({ row }) => row.original.documento || '—' },
  { accessorKey: 'razon_social', header: 'Razon Social o Nombre', cell: ({ row }) => row.original.razon_social },
  {
    accessorKey: 'estado', header: 'Estado', cell: ({ row }) => {
      // Manejar pagos_details que puede ser null, string JSON o array
      let pagosDetails: any[] = []
      if (row.original.pagos_details) {
        if (typeof row.original.pagos_details === 'string') {
          try {
            pagosDetails = JSON.parse(row.original.pagos_details)
          } catch (e) {
            pagosDetails = []
          }
        } else if (Array.isArray(row.original.pagos_details)) {
          pagosDetails = row.original.pagos_details
        }
      }

      // Usar total_importe_delivery si existe, sino usar importe como fallback
      const totalImporteDelivery = Number(row.original.total_importe_delivery ?? row.original.importe ?? 0)

      // 1. "No tiene": cuando no hay importe en la sección de delivery y no hay pagos
      if (totalImporteDelivery === 0 && (!pagosDetails || pagosDetails.length === 0)) {
        return h(USelect as any, {
          modelValue: 'No tiene',
          disabled: true,
          items: [
            { label: 'No tiene', value: 'No tiene' },
            { label: 'Pendiente', value: 'Pendiente' },
            { label: 'Pagado', value: 'Pagado' }
          ],
          class: 'bg-gray-500 text-white dark:bg-gray-500 dark:text-white'
        })
      }

      // Calcular total de pagos confirmados
      const totalPagosConfirmados = pagosDetails
        .filter((pago: any) => pago.status === 'CONFIRMADO')
        .reduce((sum: number, pago: any) => sum + Number(pago.monto ?? 0), 0)

      // Calcular total de todos los pagos (confirmados y no confirmados)
      const totalPagos = pagosDetails
        .reduce((sum: number, pago: any) => sum + Number(pago.monto ?? 0), 0)

      // Verificar si todos los pagos están confirmados
      const todosConfirmados = pagosDetails.length > 0 && pagosDetails.every((pago: any) => pago.status === 'CONFIRMADO')

      // 2. "Pagado" (verde): si totalPagosConfirmados >= totalImporteDelivery
      const isPagadoVerificado = totalImporteDelivery > 0 && totalPagosConfirmados >= totalImporteDelivery

      // 3. "Pagado" (blanco): si totalPagos >= totalImporteDelivery pero totalPagosConfirmados < totalImporteDelivery
      // (hay pagos suficientes pero no todos están confirmados)
      const tienePagosNoConfirmados = totalImporteDelivery > 0 && 
                                       totalPagos >= totalImporteDelivery && 
                                       totalPagosConfirmados < totalImporteDelivery &&
                                       pagosDetails.length > 0

      // 4. "Pendiente": en todos los demás casos (con fondo rojo)
      const estado = isPagadoVerificado ? 'Pagado' : tienePagosNoConfirmados ? 'Pagado' : 'Pendiente'
      
      const className = isPagadoVerificado
        ? 'bg-green-500 text-white dark:bg-green-500 dark:text-white'
        : tienePagosNoConfirmados
          ? 'bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600'
          : 'bg-red-500 text-white dark:bg-red-500 dark:text-white'

      return h(USelect as any, {
        modelValue: estado,
        disabled: true,
        items: [
          { label: 'No tiene', value: 'No tiene' },
          { label: 'Pendiente', value: 'Pendiente' },
          { label: 'Pagado', value: 'Pagado' }
        ],
        class: className
      })
    }
  },
  {
    accessorKey: 'servicio', header: 'Servicio', cell: ({ row }) => {
      const servicioValue = row.original.tipo_servicio||'Sin servicio';
      return h(USelect as any, {
        modelValue: servicioValue,
        items: [
          {label: 'Sin servicio', value: 'Sin servicio' ,disabled: true},
          { label: 'Delivery', value: 'DELIVERY' },
          { label: 'Montacarga', value: 'MONTACARGA' }
        ],
        size: 'xs', class: 'w-32', 'onUpdate:modelValue': (v: string) => { row.original.tipo_servicio = v; handleUpdateServicio(row.original) } })
    }
  },
  {
    accessorKey: 'importe', header: 'Importe', cell: ({ row }) => h(UInput as any, {
      modelValue: row.original.importe, size: 'xs', class: 'w-20 text-right', 'onUpdate:modelValue': (v: any) => {
        row.original.importe = v
      }
    })
  },
  { accessorKey: 'pagado', header: 'Pagado', cell: ({ row }) => formatCurrency(row.original.pagado, 'PEN') },
  {
    id: 'adelantos', header: 'Adelantos', cell: ({ row }) => {
      // Manejar pagos_details que puede ser null o string JSON
      const pagosDetails = row.original.pagos_details
        ? (typeof row.original.pagos_details === 'string'
          ? JSON.parse(row.original.pagos_details)
          : row.original.pagos_details)
        : []

      return !row.original.id_contenedor_pago ? h(PagoGrid as any, {
        pagoDetails: pagosDetails,
        currency: 'PEN',
        numberOfPagos: currentRole.value === ROLES.COORDINACION ? 3 : pagosDetails.length,
        clienteNombre: row.original.nombre,
        onSave: (data: any) => handleRegistrarPago(row.original, data),
        onDelete: (pagoId: number) => handleDeletePago(row.original, pagoId),
        showDelete: currentRole.value === ROLES.COORDINACION
      }) : null
    }
  },
 
  //div with button with icon save
  {
    accessorKey: 'actions', header: 'Acciones', cell: ({ row }) => {
      
      return h('div', { class: 'flex gap-2' }, [
        h(UButton, {
          size: 'xs',
          icon: 'material-symbols:save-sharp',
          variant: 'ghost', color: 'primary',
          title: 'Guardar', onClick: () => handleUpdate(row.original)
        }),
        //arrow with only cobro message
        h(UButton, {
          size: 'xs',
          icon: 'i-heroicons-paper-airplane',
          variant: 'ghost', color: 'primary',
          title: 'Cobro', onClick: () => handleCobroMessage(row.original)
        })
      ])
    }
  }
])
const handleUpdate = (row: any) => {
  try {
    
    const data = {
      id_cotizacion: row.id_cotizacion,
      importe: row.importe
    }
    withSpinner(async () => {
      const response = await updateImporteDelivery(data)
      if (response?.success) {
        showSuccess('Importe guardado', 'Importe guardado correctamente')
        getDelivery(id)
      } else {
        showError('Error', response?.error || 'No se pudo guardar el importe')
      }
    }, 'Guardando importe...')
  } catch (error) {
    showError('Error', error as string)
  }

}
const handleUpdateServicio = (row: any) => {
  try {
    const data = {
      id_cotizacion: row.id_cotizacion || row.id,
      tipo_servicio: row.tipo_servicio || 'DELIVERY'
    }
    withSpinner(async () => {
      const response = await updateServicioDelivery(data)
      if (response?.success) {
        showSuccess('Servicio actualizado', 'Servicio actualizado correctamente')
      } else {
        showError('Error', response?.error || 'No se pudo actualizar el servicio')
      }
    }, 'Actualizando servicio...')
  } catch (error) {
    showError('Error', error as string)
  }
}
watch(entregas, () => { if (activeTab.value === 'delivery') getDelivery(id) })

// Modal de acciones
const showAccionesModal = ref(false)
const selectedRowForModal = ref<any>(null)

const openAccionesModal = (row: any) => {
  modalAcciones.open({
    idCotizacion: row.id_cotizacion || row.id,
    clienteNombre: row.nombre || '',
  })
}

const closeAccionesModal = () => {
  showAccionesModal.value = false
  selectedRowForModal.value = null
}

const handleAccionesModalSuccess = () => {
  getDelivery(id)
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>