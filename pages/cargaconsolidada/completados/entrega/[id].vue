<template>
  <div class="p-6">
    <DataTable v-if="activeTab === 'clientes'" title="" :data="clientes" :columns="clientesColumns" :loading="loading"
      icon="" :show-pagination="false" :current-page="currentPage" :total-pages="totalPages"
      :total-records="totalRecords" :items-per-page="itemsPerPage" :search-query-value="search"
      :show-secondary-search="false" :show-filters="true" :filter-config="clientesFilterConfig" :show-export="false"
  empty-state-message="No se encontraron registros de entrega." @update:primary-search="handleClientesSearch"
  @page-change="handleClientesPageChange" @items-per-page-change="handleClientesItemsPerPageChange"
  @filter-change="handleClientesFilterChange" @clear-filters="onClearClientesFilters"
  :hide-back-button="false" :show-primary-search="true" :show-body-top="true"
      :previous-page-url="`/cargaconsolidada/completados/pasos/${id}`">
      <template #actions>
        <UButton label="Fechas y Horarios" color="primary" variant="solid" class="py-3" icon="i-heroicons-calendar"
          @click="navigateTo(`/cargaconsolidada/completados/entrega/fechas-horarios/${id}`)" />
      </template>
      <template #body-top>
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-3">
            <SectionHeader :title="`Entregas #${carga}`" :headers="headers" :loading="loadingHeaders" />
            <div class="flex gap-2 items-center">
              <UButton size="lg" color="primary" variant="outline" label="Copiar Lima" icon="i-heroicons-clipboard-document" @click="copyToClipboard(linkLima, 'Lima')" />
              <UButton size="lg" color="warning" variant="outline" label="Copiar Provincia" icon="i-heroicons-clipboard-document" @click="copyToClipboard(linkProvincia, 'Provincia')" />
              <transition name="fade">
                <span v-if="copiedLima || copiedProvincia" class="text-green-600 font-medium text-sm">¡Copiado!</span>
              </transition>
            </div>
          </div>
          <UTabs v-model="activeTab" :items="tabs" color="neutral" variant="pill" class="mb-4 w-80 h-15" />
        </div>
      </template>
    </DataTable>
    <DataTable v-if="activeTab === 'entregas'" title="" :data="entregas" :columns="entregasColumns" :loading="loading"
      icon="" :show-pagination="false" :current-page="currentPage" :total-pages="totalPages"
      :total-records="totalRecords" :items-per-page="itemsPerPage" :search-query-value="search"
      :show-secondary-search="false" :show-filters="false" :filter-config="filterConfig" :show-export="false"
      empty-state-message="No se encontraron registros de entrega." @update:primary-search="handleSearch"
      @page-change="handlePageChange" @items-per-page-change="handleItemsPerPageChange"
      @filter-change="handleFilterChange" :hide-back-button="false" :show-primary-search="false" :show-body-top="true"
      :previous-page-url="`/cargaconsolidada/completados/pasos/${id}`">
      <template #body-top>
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-3">
            <SectionHeader :title="`Entregas #${carga}`" :headers="headers" :loading="loadingHeaders" />
            <div class="flex gap-2 items-center">
              <UButton size="lg" color="primary" variant="outline" label="Copiar Lima" icon="i-heroicons-clipboard-document" @click="copyToClipboard(linkLima, 'Lima')" />
              <UButton size="lg" color="warning" variant="outline" label="Copiar Provincia" icon="i-heroicons-clipboard-document" @click="copyToClipboard(linkProvincia, 'Provincia')" />
              <transition name="fade">
                <span v-if="copiedLima || copiedProvincia" class="text-green-600 font-medium text-sm">¡Copiado!</span>
              </transition>
            </div>
          </div>
          <UTabs v-model="activeTab" :items="tabs" color="neutral" variant="pill" class="mb-4 w-80 h-15" />
        </div>
      </template>
    </DataTable>
    <DataTable v-if="activeTab === 'delivery'" title="" :data="delivery" :columns="deliveryColumns" :loading="loading"
      icon="" :show-pagination="false" :hide-back-button="false" :show-primary-search="false" :show-body-top="true"
      :previous-page-url="`/cargaconsolidada/completados/pasos/${id}`">
      <template #body-top>
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-3">
            <SectionHeader :title="`Delivery #${carga}`" :headers="headers" :loading="loadingHeaders" />
            <div class="flex gap-2 items-center">
              <UButton size="lg" color="primary" variant="outline" label="Copiar Lima" icon="i-heroicons-clipboard-document" @click="copyToClipboard(linkLima, 'Lima')" />
              <UButton size="lg" color="warning" variant="outline" label="Copiar Provincia" icon="i-heroicons-clipboard-document" @click="copyToClipboard(linkProvincia, 'Provincia')" />
              <transition name="fade">
                <span v-if="copiedLima || copiedProvincia" class="text-green-600 font-medium text-sm">¡Copiado!</span>
              </transition>
            </div>
          </div>
          <UTabs v-model="activeTab" :items="tabs" color="neutral" variant="pill" class="mb-4 w-80 h-15" />
          <div class="text-xs text-gray-500">Gestiona importes y adelantos. Cambia el importe manualmente y registra
            adelantos con los botones.</div>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import SectionHeader from '../../../../components/commons/SectionHeader.vue'
import { useEntrega } from '../../../../composables/cargaconsolidada/entrega/useEntrega'
import { useUserRole } from '../../../../composables/auth/useUserRole'
import { UBadge, UButton, UInput, UTabs } from '#components'
import PagoGrid from '../../../../components/PagoGrid.vue'
import { useModal } from '../../../../composables/commons/useModal'
import { useSpinner } from '../../../../composables/commons/useSpinner'
import { ROLES } from '../../../../constants/roles'

const route = useRoute()
const id = Number(route.params.id)
const { currentRole, currentId } = useUserRole()
const { showConfirmation, showSuccess, showError } = useModal()
const { withSpinner } = useSpinner()

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
  headers,
  carga,
  loadingHeaders,
  getHeaders,
  // delivery
  delivery,
  getDelivery,
  updateImporteDelivery,
  registrarPagoDelivery,
  deletePagoDelivery,
  sendMessageForCotizacion,
  deleteEntregaRegistro,
  clearClientesFilters,
  clearFilters
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
// Links externos por contenedor (usa el id del contenedor "carga")
const linkLima = computed(() => `https://clientes.probusiness.pe/formulario-entrega/lima/${id}`)
const linkProvincia = computed(() => `https://clientes.probusiness.pe/formulario-entrega/provincia/${id}`)
// Estados para mostrar mensaje de copiado
const copiedLima = ref(false)
const copiedProvincia = ref(false)

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
    accessorKey: 'nombre',
    header: 'Nombre',
    cell: ({ row }) => row.original.nombre?.toUpperCase?.() || row.original.nombre
  },
  {
    accessorKey: 'documento',
    header: 'DNI'
  },
  {
    accessorKey: 'telefono',
    header: 'Whatsapp'
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
    header: 'Estado',
    cell: ({ row }) => {
      const totalPagos = Number(row.original.total_pagos ?? 0)
      const totalLogImp = Number(row.original.total_logistica_impuestos ?? 0)
      const isPagado = totalPagos >= totalLogImp
      const label = isPagado ? 'Pagado' : 'Pendiente'
      const color = isPagado ? 'success' : 'warning'
      return h(UBadge, { label, color, variant: 'soft' })
    }
  },
  {
    id: 'actions',
    header: 'Accion',
    cell: ({ row }) => h('div', { class: 'flex gap-2' }, [
      h(UButton, {
        size: 'xs',
        icon: 'i-heroicons-paper-airplane',
        variant: 'ghost',
        color: 'info',
        title: 'Enviar Mensaje',
        onClick: () => handleEnviarMensaje(row.original.id)
      })
    ])
  }
])
// Columnas actualizadas para Entregas (completados) – mismas que en 'abiertos'
const entregasColumns = ref<TableColumn<any>[]>([
  { accessorKey: 'nro', header: 'N', cell: ({ row }) => row.index + 1 },
  { accessorKey: 'nombre', header: 'Nombre', cell: ({ row }) => row.original.nombre || '—' },
  { accessorKey: 'telefono', header: 'Whatsapp', cell: ({ row }) => row.original.telefono || '—' },
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
    accessorKey: 'tipo_entrega', header: 'Entrega', cell: ({ row }) => {
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
  { accessorKey: 'documento', header: 'Ruc o Dni', cell: ({ row }) => row.original.r_doc || row.original.pick_doc || '—' },
  { accessorKey: 'razon_social', header: 'Razon social o Nombre', cell: ({ row }) => row.original.r_name || row.original.pick_name || '—' },
  {
    accessorKey: 'fecha_programada', header: 'Fecha', cell: ({ row }) => {
      const fp = formatDateTimeToDmy(row.original.delivery_date)
      if (!fp) return '—'
      const date = fp.includes(' ') ? fp.split(' ')[0] : fp.split('T')[0]
      return date || '—'
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
    id: 'estado', header: 'Estado', cell: ({ row }) => {
      const estado = row.original.estado_entrega || (row.original.conformidad_count ? 'ENTREGADO' : 'PENDIENTE')
      const color = estado === 'ENTREGADO' ? 'success' : estado === 'PROGRAMADA' ? 'warning' : 'neutral'
      return h(UBadge, { label: estado, color, variant: 'soft' })
    }
  },
  {
    id: 'accion', header: 'Accion', cell: ({ row }) => h('div', { class: 'flex gap-2' }, [
      h(UButton, { size: 'xs', icon: 'i-heroicons-eye', variant: 'ghost', color: 'neutral', title: 'Ver detalle', onClick: async () => goToClienteDetalle(row.original) }),
      h(UButton, { size: 'xs', icon: 'i-heroicons-trash', variant: 'ghost', color: 'error', title: 'Eliminar registro', onClick: () => handleEliminarRegistro(row.original) })
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
  navigateTo(`/cargaconsolidada/completados/entrega/clientes/${cid}`)
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
        await getClientes(id)
      } else if (newVal === 'entregas') {
        await getEntregas(id)
      } else if (newVal === 'delivery') {
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
  // reuse composable helper
  clearClientesFilters()
}
const deliveryColumns = ref<TableColumn<any>[]>([
  { accessorKey: 'nro', header: 'N', cell: ({ row }) => row.index + 1 },
  { accessorKey: 'nombre', header: 'Nombre', cell: ({ row }) => row.original.nombre || '—' },
  { accessorKey: 'telefono', header: 'Whatsapp', cell: ({ row }) => row.original.telefono || '—' },
  {
    accessorKey: 'entrega', header: 'Entrega', cell: ({ row }) => {
      return h(UBadge, {
        label: row.original.entrega || '—',
        color: row.original.entrega === 'LIMA' ? 'success' : row.original.entrega === 'PROVINCIA' ? 'primary' : 'neutral',
        variant: 'soft'
      })
    }
  },
  {
    accessorKey: 'estado', header: 'Estado', cell: ({ row }) => {
      //if pagado>= importe then return Pagado else return Pendiente
      const estado = row.original.pagado >= row.original.importe && row.original.pagado > 0 ? 'Pagado' : 'Pendiente'
      const color = row.original.pagado >= row.original.importe && row.original.pagado > 0 ? 'success' : 'warning'
      return h(UBadge, { label: estado, color, variant: 'soft' })
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
watch(entregas, () => { if (activeTab.value === 'delivery') getDelivery(id) })
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>