<template>
  <div class="md:p-6">
    <DataTable title="Cotizaciones" :show-title="true" icon="i-heroicons-users" :data="cotizaciones" :columns="columns"
      :loading="loading" :current-page="currentPage" :total-pages="totalPages" :total-records="totalRecords"
      :items-per-page="itemsPerPage" :search-query-value="search" :primary-search-value="search"
      :show-primary-search="true" :showPrimarySearchLabel="false" :primary-search-placeholder="'Buscar por'"
      :show-filters="true" :filter-config="filterConfig" :filters-value="filters" :show-export="true" :show-headers="false"
      :show-body-top="true"
      empty-state-message="No se encontraron cotizaciones que coincidan con los criterios de búsqueda."
      :show-new-button="isDesktop" new-button-label="Crear Cotización" :on-new-button-click="handleNewButtonClick"
      @update:search-query="handleSearch" @update:primary-search="handleSearch"
      @page-change="handlePageChange" @items-per-page-change="handleItemsPerPageChange" @filter-change="handleFilterChange"
      @export="handleExport">

      <template #body-top>
        <div class="flex flex-col gap-3 w-full">
          <SectionHeader :headers="cotizacionKpis" :loading="loading" :skeleton-count="3" grid>
            <template #extra="{ header }">
              <div v-if="header.key === 'cotizaciones_pendientes'" class="flex flex-wrap gap-1.5 mt-1.5">
                <button
                  v-for="chip in seguimientoChips(header)"
                  :key="chip.value"
                  type="button"
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] cursor-pointer transition-colors"
                  :class="seguimientoFilter === chip.value
                    ? 'bg-orange-50 text-orange-700 border-[#f26522] dark:bg-orange-900/30 dark:text-orange-300'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#f26522] dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'"
                  :title="`Filtrar: ${chip.label}`"
                  @click.stop="toggleSeguimientoFilter(chip.value)"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="chip.dotClass" />
                  {{ chip.label }} <strong class="font-bold">{{ chip.count }}</strong>
                </button>
              </div>
            </template>
          </SectionHeader>
          <SectionHeader :headers="cbmKpis" :loading="loading" :skeleton-count="4" grid />
          <div class="flex items-center gap-3 flex-wrap">
            <UTabs v-model="activeTab" color="neutral" :items="pageTabs" size="sm" variant="pill" class="mb-1 w-80 h-15" />
            <span
              v-if="seguimientoFilter"
              class="inline-flex items-center gap-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-full pl-3 pr-1 py-1 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800"
            >
              Filtrando: {{ seguimientoFilter === 'DESCARTADA' ? 'Descartadas' : 'En seguimiento' }}
              <UButton icon="i-heroicons-x-mark" size="xs" color="neutral" variant="ghost" title="Quitar filtro" @click="toggleSeguimientoFilter(seguimientoFilter)" />
            </span>
            <UButton
              label="Motivos de descarte"
              icon="i-heroicons-adjustments-horizontal"
              color="neutral"
              variant="outline"
              class="ml-auto font-normal"
              @click="openMotivos"
            />
          </div>
        </div>
      </template>

      <template #actions>
        <UButton
          label="Gestionar tarifas de calculadora"
          icon="i-heroicons-calculator"
          color="neutral"
          variant="outline"
          class="h-8 md:h-11 font-normal whitespace-normal text-left max-w-[200px] lg:max-w-none"
          @click="navigateTo('/cotizaciones/tarifas-calculadora')"
        />
      </template>

      <template #error-state>
        <ErrorState :message="error || 'Error desconocido'" />
      </template>
    </DataTable>

    <MotivosDescarteModal
      v-model="showMotivosModal"
      :handlers="razonDescarteHandlers"
      :target-id="motivoTargetId"
      @assign="handleMotivoCreado"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCalculadoraImportacion } from '~/composables/useCalculadoraImportacion'
import SectionHeader from '~/components/commons/SectionHeader.vue'
import type { Header } from '~/types/data-table'
const { cotizaciones, loading, error, pagination, headers, tab, seguimientoFilter, search, itemsPerPage, totalPages, totalRecords, currentPage, filters, filterOptions, handleSearch, handlePageChange, handleItemsPerPageChange, handleFilterChange, getCotizaciones, estadoCotizaciones, deleteCotizacionCalculadora, duplicateCotizacionCalculadora, changeEstadoCotizacionCalculadora, vincularCotizacionCalculadora, exportCotizacionesList, getRazonesDescarte, createRazonDescarte, deleteRazonDescarte, updateSeguimientoCotizacion } = useCalculadoraImportacion()
import MotivosDescarteModal from '~/components/calculadora/MotivosDescarteModal/index.vue'
import type { TableColumn } from '@nuxt/ui'
import { UButton, USelect, UBadge } from '#components'
import { createLazyView } from '~/utils/lazyView'

const MoveCotizacionModal = createLazyView(() => import('~/components/shared/MoveCotizacionModal/index.vue'))
import { useModal } from '~/composables/commons/useModal';
import { useSpinner } from '~/composables/commons/useSpinner';
import type { FilterConfig } from '~/types/data-table'
import { useIsDesktop } from '~/composables/useResponsive'
import { STATUS_BG_CLASSES, CUSTOMIZED_ICONS_URL } from '~/constants/ui'
import { formatCurrency } from '~/utils/formatters'
// Abiertos: consolidado abierto o pendientes sin contenedor asignado. Embarcados: contenedor COMPLETADO.
// Ambos tabs usan la misma tabla y KPIs; solo cambian los valores (filtro `tab` del backend).
const pageTabs = [
  { label: 'Abiertos', value: 'abiertos' },
  { label: 'Embarcados', value: 'embarcados' },
]
const activeTab = computed({
  get: () => tab.value,
  set: (value: string) => {
    const next = value === 'embarcados' ? 'embarcados' : 'abiertos'
    if (next === tab.value) return
    tab.value = next
    seguimientoFilter.value = ''
    pagination.value.current_page = 1
    getCotizaciones()
  }
})

const seguimientoChips = (header: Header) => {
  const raw = header as Header & { seguimiento?: number; descartadas?: number }
  return [
    { value: 'SEGUIMIENTO' as const, label: 'En seguimiento', count: raw.seguimiento ?? 0, dotClass: 'bg-amber-500' },
    { value: 'DESCARTADA' as const, label: 'Descartadas', count: raw.descartadas ?? 0, dotClass: 'bg-gray-400' },
  ]
}

const toggleSeguimientoFilter = async (value: 'SEGUIMIENTO' | 'DESCARTADA' | '') => {
  seguimientoFilter.value = seguimientoFilter.value === value ? '' : value
  pagination.value.current_page = 1
  await getCotizaciones()
}

const showMotivosModal = ref(false)
const openMotivos = () => {
  motivoTargetId.value = null
  showMotivosModal.value = true
}
const { isDesktop } = useIsDesktop()
const route = useRoute()
const { showSuccess, showConfirmation, showError } = useModal()
const overlay = useOverlay()
const moveCotizacionModal = overlay.create(MoveCotizacionModal)
const { withSpinner } = useSpinner()
const handleNewButtonClick = () => {
  navigateTo('/cotizaciones/crear')
}

const CALCULADORA_HEADER_ICONS: Record<string, string> = {
  cbm_total_china: CUSTOMIZED_ICONS_URL.CHINA,
  cbm_total_peru: CUSTOMIZED_ICONS_URL.PERU,
  cbm_pendiente: 'mage:box-3d',
  cbm_total_imo: 'mdi:biohazard',
}

const kpiHeaders = computed<Header[]>(() => {
  const raw = headers.value as Header[] | Record<string, Header> | null
  if (!raw) return []
  const entries = Array.isArray(raw)
    ? raw.map((header, index) => [header.key || String(index), header] as const)
    : Object.entries(raw)
  return entries
    .filter(([key]) => !['total_fob', 'total_logistica', 'total_impuestos'].includes(key))
    .map(([key, header]) => ({
      ...header,
      key,
      icon: header.icon || CALCULADORA_HEADER_ICONS[key] || 'fluent:box-32-filled',
    }))
})
// Fila 1: cotizaciones (total, confirmadas, pendientes). Fila 2: CBM.
const COTIZACION_KPI_KEYS = ['total_cotizaciones', 'cotizaciones_confirmadas', 'cotizaciones_pendientes']
const cotizacionKpis = computed(() => kpiHeaders.value.filter((h) => COTIZACION_KPI_KEYS.includes(h.key || '')))
const cbmKpis = computed(() => kpiHeaders.value.filter((h) => !COTIZACION_KPI_KEYS.includes(h.key || '')))

const columns: TableColumn<any>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }: { row: any }) => {
      return row.index + 1
    }
  },
  {
    accessorKey: 'fecha',
    header: 'Fecha',
    cell: ({ row }: { row: any }) => formatDateTimeToDmy(row.original.created_at)
  },
  {
    //show in two rows the contacto with the name, dni and whatsapp
    accessorKey: 'contacto',
    header: 'Contacto',
    cell: ({ row }: { row: any }) => {
      const nombre = row.original?.nombre_cliente || row.original?.nombre || ''
      const telefono = row.original?.whatsapp_cliente || row.original?.whatsapp || ''
      const dni = row.original?.dni_cliente || row.original?.dni || ''
      const codigo=row.original?.cod_cotizacion || ''
      const cod_contract=row.original?.cod_contract || ''
      const estado_cotizador=row.original?.estado_cotizador || ''
      return h('div', { class: 'py-2 w-30 whitespace-normal' }, [
        h('div', { class: 'font-medium' }, nombre),
        h('div', { class: 'text-sm text-gray-500' }, dni),
        h('div', { class: 'text-sm text-gray-500' }, telefono),
        h('div', { class: 'text-sm text-gray-500' }, codigo),
        //if estado_cotizador is CONFIRMADO, show the cod_contract
        estado_cotizador === 'CONFIRMADO' ? h('div', { class: 'text-sm text-gray-500' }, cod_contract) : null
      ])
    }
  },
  {
    accessorKey: 'volumen',
    header: 'Vol',
    cell: ({ row }: { row: any }) => {
      return h('div', { class: 'py-2 w-10 whitespace-normal' }, [
        h('div', { class: 'font-medium' }, row.original.totales.total_cbm),
      ])
    }
  },
  {
    accessorKey: 'qty_item',
    header: 'Item',
    cell: ({ row }: { row: any }) => row.original.totales.total_productos
  },
  {
    accessorKey: 'fob',
    header: 'Fob',
    cell: ({ row }: { row: any }) => formatCurrency(row.original.total_fob)
  },
  {
    accessorKey: 'logistica',
    header: 'Logistica',
    cell: ({ row }: { row: any }) => formatCurrency(row.original.logistica)
  },
  {
    accessorKey: 'impuesto',
    header: 'Impuesto',
    cell: ({ row }: { row: any }) => formatCurrency(row.original.total_impuestos)
  },
  {
    accessorKey: 'tarifa',
    header: 'Tarifa',
    cell: ({ row }: { row: any }) => formatCurrency(row.original.tarifa)
  },
  {
    accessorKey: 'descuento',
    header: 'Desct.',
    cell: ({ row }: { row: any }) => formatCurrency(row.original.tarifa_descuento || 0)
  },
  {
    accessorKey: 'campania',
    header: 'Campaña',
    cell: ({ row }: { row: any }) => `${row.original.carga_contenedor}` || '-'
  },
  {
    accessorKey: 'cotizador',
    header: 'Cotizador',
    cell: ({ row }: { row: any }) => row.original.nombre_creador || '-'
  },
  {
    accessorKey: 'vendedor',
    header: 'Vendedor',
    cell: ({ row }: { row: any }) => row.original.nombre_vendedor || '-'
  },
  {
    accessorKey: 'cotizacion',
    header: 'Cotizacion',
    cell: ({ row }: { row: any }) => {
      //div with button to download the cotizacion
      return (h('div', [
        row.original.url_cotizacion ? h(UButton, {
          color: 'success',
          size: 'xl',
          variant: 'ghost',
          icon: 'vscode-icons:file-type-excel',
          label: '',
          onClick: (event: MouseEvent) => {
            window.open(row.original.url_cotizacion, '_blank')
          }
        }) : null,
        row.original.url_cotizacion_pdf ? h(UButton, {
          color: 'error',
          size: 'xl',
          variant: 'ghost',
          icon: 'vscode-icons:file-type-pdf2',
          label: '',
          onClick: (event: MouseEvent) => {
            window.open(row.original.url_cotizacion_pdf, '_blank')
          }
        }) : null,
      ]))
    }
  },

  {
    accessorKey: 'go_to_cotizacion_contenedor',
    header: 'Ir a cotización',
    cell: ({ row }: { row: any }) => {
      const idCotizacion = row.original?.id_cotizacion
      const idContenedor = row.original?.id_carga_consolidada_contenedor

      if (!idCotizacion || !idContenedor) {
        return h(UBadge, { label: '—', color: 'neutral', variant: 'soft', size: 'sm' })
      }

      return h(UButton, {
        color: 'primary',
        size: 'sm',
        variant: 'ghost',
        icon: 'i-heroicons-arrow-top-right-on-square',
        label: '',
        title: 'Ver cotización en contenedor',
        onClick: () => {
          const base = tab.value === 'embarcados' ? '/cargaconsolidada/completados' : '/cargaconsolidada/abiertos'
          navigateTo(`${base}/cotizaciones/${idContenedor}?idCotizacion=${idCotizacion}`)
        }
      })
    }
  },
  {
    accessorKey: 'proveedores_vinculados',
    header: 'Proveedores vinculados',
    cell: ({ row }: { row: any }) => {
      const proveedores = (row.original?.proveedores ?? []) as any[]
      const tieneProveedorSinVinculo = proveedores.some((p: any) => {
        const codeSupplierOk = p?.code_supplier != null && String(p.code_supplier).trim().length > 0
        const idProveedorOk = p?.id_proveedor != null && String(p.id_proveedor).toString().length > 0
        return !codeSupplierOk || !idProveedorOk
      })

      if (!tieneProveedorSinVinculo) {
        return h(UBadge, { label: 'Sí', color: 'success', variant: 'soft', size: 'sm' })
      }

      const canVincular = !!row.original?.url_cotizacion && !!row.original?.id_carga_consolidada_contenedor

      return h(UButton, {
        color: 'primary',
        size: 'sm',
        variant: 'ghost',
        icon: 'i-heroicons-link',
        label: '',
        title: 'Vincular proveedores (cotización)',
        disabled: !canVincular,
        onClick: () => handleVincularCotizacion(row.original.id)
      })
    }
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }: { row: any }) => {
      const estado = row.original.estado
      return h(USelect as any, {
        class: [STATUS_BG_CLASSES[estado as keyof typeof STATUS_BG_CLASSES], 'min-w-36'],
        items: estadoCotizaciones.value.filter((item: any) => item.showOptions),
        modelValue: estado,
        'onUpdate:modelValue': (value: string) => {
          handleEstadoChange(row.original.id, value)
        }
      })
    }
  },
  {
    accessorKey: 'seguimiento',
    header: 'Seguimiento',
    cell: ({ row }: { row: any }) => {
      const estado = row.original.estado
      if (estado !== 'PENDIENTE' && estado !== 'COTIZADO') {
        return h(UBadge, { label: '—', color: 'neutral', variant: 'soft', size: 'sm' })
      }
      const id = Number(row.original.id)
      const raw = row.original.seguimiento
      const guardado: SeguimientoValue = raw === 'DESCARTADA' || raw === 'SEGUIMIENTO' ? raw : SIN_SELECCIONAR
      // "Descartada" elegida pero aún sin motivo: se muestra el select de motivo antes de guardar.
      const seguimiento: SeguimientoValue = descartePendiente.value[id] ? 'DESCARTADA' : guardado
      const idRazon = guardado === 'DESCARTADA' ? Number(row.original.id_razon_descarte) || undefined : undefined
      return h('div', { class: 'flex flex-col gap-1.5 w-40' }, [
        h(USelect as any, {
          class: 'w-full',
          color: seguimiento === 'DESCARTADA' ? 'neutral' : seguimiento === 'SEGUIMIENTO' ? 'warning' : 'neutral',
          variant: seguimiento === 'SEGUIMIENTO' ? 'soft' : 'outline',
          items: SEGUIMIENTO_OPTIONS,
          modelValue: seguimiento,
          'onUpdate:modelValue': (value: SeguimientoValue) => {
            handleSeguimientoChange(id, value, guardado)
          }
        }),
        seguimiento === 'DESCARTADA'
          ? h(USelect as any, {
            class: 'w-full',
            size: 'xs',
            placeholder: 'Elegir motivo…',
            items: motivoItems(row.original),
            modelValue: idRazon,
            'onUpdate:modelValue': (value: number) => {
              handleMotivoChange(id, Number(value), idRazon)
            }
          })
          : null
      ])
    }
  },

  {
    accessorKey: 'acciones',
    header: 'Acciones',
    cell: ({ row }: { row: any }) => {
      const idCotizacion = row.original?.id_cotizacion
      const proveedores = (row.original?.proveedores ?? []) as any[]
      const tieneProveedorSinVinculo = proveedores.some((p: any) => {
        const codeSupplierOk = p?.code_supplier != null && String(p.code_supplier).trim().length > 0
        const idProveedorOk = p?.id_proveedor != null && String(p.id_proveedor).toString().length > 0
        return !codeSupplierOk || !idProveedorOk
      })
      const canVincular = !!row.original?.url_cotizacion && !!row.original?.id_carga_consolidada_contenedor

      // options delete, edit.duplicate,send
      const nodes: any[] = [
        h(UButton, {
          color: 'error',
          size: 'sm',
          variant: 'ghost',
          icon: 'i-heroicons-trash',
          label: '',
          onClick: (_event: MouseEvent) => {
            handleDelete(row.original.id)
          }
        }),
        row.original.estado !== 'CONFIRMADO' ? h(UButton, {
          color: 'warning',
          size: 'sm',
          variant: 'ghost',
          icon: 'i-heroicons-pencil',
          label: '',
          onClick: (_event: MouseEvent) => {
            handleEdit(row.original.id)
          }
        }) : null,
        h(UButton, {
          color: 'primary',
          size: 'sm',
          variant: 'ghost',
          icon: 'i-heroicons-document-duplicate',
          label: '',
          onClick: (_event: MouseEvent) => {
            handleDuplicate(row.original.id)
          }
        })
      ]

      // Documentos solo si la cotización existe y NO hay proveedores sin vincular (code_supplier/id_proveedor)
      if (idCotizacion && !tieneProveedorSinVinculo) {
        nodes.push(h(UButton, {
          color: 'neutral',
          size: 'sm',
          variant: 'ghost',
          icon: 'i-heroicons-folder-open',
          label: '',
          title: 'Documentos asociados',
          onClick: () => {
            handleDocumentos(idCotizacion, row.original.id)
          }
        }))
      } 

      return h('div', nodes)
    }
  }
]
// Valor por defecto: seguimiento null en BD se muestra como "Sin seleccionar".
const SIN_SELECCIONAR = 'SIN_SELECCIONAR' as const
type SeguimientoValue = 'SEGUIMIENTO' | 'DESCARTADA' | typeof SIN_SELECCIONAR
const SEGUIMIENTO_OPTIONS = [
  { label: 'Sin seleccionar', value: SIN_SELECCIONAR },
  { label: 'En seguimiento', value: 'SEGUIMIENTO' },
  { label: 'Descartada', value: 'DESCARTADA' },
]
// Valor del option "+ Crear motivo…" en el select de motivo.
const CREAR_MOTIVO = -1
// Filas con "Descartada" elegida que aún no tienen motivo guardado.
const descartePendiente = ref<Record<number, boolean>>({})
const razones = ref<Array<{ id: number; name: string; uses?: number }>>([])
// Fila a la que se asigna el motivo creado desde "+ Crear motivo…".
const motivoTargetId = ref<number | null>(null)

const loadRazones = async () => {
  try {
    razones.value = await getRazonesDescarte()
  } catch (error) {
    console.error('Error al cargar motivos de descarte:', error)
  }
}

const motivoItems = (original: any) => {
  const items = razones.value.map((r) => ({ label: r.name, value: r.id }))
  // Un motivo eliminado sigue mostrándose en las cotizaciones que ya lo usan.
  const actual = Number(original?.id_razon_descarte)
  if (actual && !items.some((i) => i.value === actual) && original?.razon_descarte_nombre) {
    items.unshift({ label: original.razon_descarte_nombre, value: actual })
  }
  return [...items, { label: '+ Crear motivo…', value: CREAR_MOTIVO }]
}

const setDescartePendiente = (id: number, pendiente: boolean) => {
  const next = { ...descartePendiente.value }
  if (pendiente) next[id] = true
  else delete next[id]
  descartePendiente.value = next
}

const guardarSeguimiento = async (id: number, seguimiento: 'SEGUIMIENTO' | 'DESCARTADA' | null, idRazon?: number) => {
  await withSpinner(async () => {
    try {
      const result = await updateSeguimientoCotizacion(id, seguimiento, idRazon ?? null)
      if (result?.success) {
        setDescartePendiente(id, false)
        showSuccess('Seguimiento actualizado', result?.message || 'El seguimiento se actualizó correctamente.')
        await getCotizaciones()
      } else {
        showError('Error al actualizar el seguimiento', result?.message || 'No se pudo actualizar el seguimiento')
      }
    } catch (error: any) {
      showError('Error al actualizar el seguimiento', error?.data?.message || error?.message || 'No se pudo actualizar el seguimiento')
    }
  })
}

const handleMotivoChange = async (id: number, value: number, actual?: number) => {
  if (value === CREAR_MOTIVO) {
    motivoTargetId.value = id
    showMotivosModal.value = true
    return
  }
  if (!value || value === actual) return
  await guardarSeguimiento(id, 'DESCARTADA', value)
}

const handleMotivoCreado = async (reasonId: number) => {
  const id = motivoTargetId.value
  motivoTargetId.value = null
  if (id) await guardarSeguimiento(id, 'DESCARTADA', reasonId)
}

watch(showMotivosModal, (open) => {
  if (!open) {
    motivoTargetId.value = null
    loadRazones()
  }
})

const razonDescarteHandlers = {
  fetchReasons: async () => await getRazonesDescarte(),
  createReason: async (name: string) => {
    const response = await createRazonDescarte(name)
    return response?.data
  },
  deleteReason: async (id: number) => {
    const response = await deleteRazonDescarte(id)
    if (!response?.success) {
      throw new Error(response?.message || 'No se pudo eliminar la razón')
    }
  },
}

const handleSeguimientoChange = async (id: number, value: SeguimientoValue, guardado: SeguimientoValue) => {
  if (value === 'DESCARTADA') {
    // No se guarda hasta elegir el motivo en el select que aparece debajo.
    if (guardado !== 'DESCARTADA') setDescartePendiente(id, true)
    return
  }
  setDescartePendiente(id, false)
  if (value === guardado) return
  await guardarSeguimiento(id, value === SIN_SELECCIONAR ? null : value)
}

const handleEstadoChange = (id: string, value: string) => {
  // Validar que si se quiere cambiar a COTIZADO, debe tener id_carga_consolidada
  if (value === 'COTIZADO') {
    const cotizacion = cotizaciones.value.find((c: any) => c.id === Number(id))
    if (!cotizacion || !cotizacion.id_carga_consolidada_contenedor) {
      showError('No se puede cambiar a COTIZADO', 'La cotización debe estar asociada a una carga consolidada para poder cambiar su estado a COTIZADO.')
      return
    }
  }

  showConfirmation('Cambiar Estado de Cotización', '¿Estás seguro de que deseas cambiar el estado de esta cotización?',
    async () => {
      await withSpinner(async () => {
        try {
          const result = await changeEstadoCotizacionCalculadora(Number(id), value)
          if (result.success) {
            showSuccess('Estado de cotización cambiado correctamente', 'El estado de la cotización ha sido cambiado correctamente')
            await getCotizaciones()
          } else {
            showError('Error al cambiar el estado de la cotización', 'Error al cambiar el estado de la cotización')
          }
        } catch (error) {
          showError('Error al cambiar el estado de la cotización', 'Error al cambiar el estado de la cotización')
        }
      })
    },
    () => {
      
    }
  )
}
const handleDelete = (id: string) => {
  showConfirmation('Eliminar Cotización', '¿Estás seguro de que deseas eliminar esta cotización?',
    async () => {
      try {
        await withSpinner(async () => {
          const result = await deleteCotizacionCalculadora(Number(id))
          if (result.success) {
            showSuccess('Cotización eliminada correctamente', 'La cotización ha sido eliminada correctamente')
            await getCotizaciones()
          } else {
            showError('Error al eliminar la cotización', 'Error al eliminar la cotización')
          }
        })
      } catch (error) {
        showError('Error al eliminar la cotización', 'Error al eliminar la cotización')
      }
    },
    () => {
      
    }
  )
}
const handleEdit = (id: string) => {
  navigateTo(`/cotizaciones/${id}`)
}
const handleDocumentos = (idCotizacion: string | number, idCalculadoraFila: string | number) => {
  const id = Number(idCotizacion)
  const idCalc = Number(idCalculadoraFila)
  if (!id) return
  // Consume la vista nueva de documentación por cotización (abiertos); idCalculadora para volver al listado filtrado
  navigateTo({
    path: `/cargaconsolidada/abiertos/cotizaciones/documentacion/${id}`,
    query: {
      backTo: '/cotizaciones',
      ...(idCalc > 0 ? { idCalculadora: String(idCalc) } : {})
    }
  })
}

const handleVincularCotizacion = (idCalculadora: string | number) => {
  const id = Number(idCalculadora)
  if (!id) return

  showConfirmation(
    'Vincular cotización',
    '¿Estás seguro de que deseas vincular/crear la cotización en carga consolidada? Se habilitarán los documentos asociados.',
    async () => {
      await withSpinner(async () => {
        try {
          const result = await vincularCotizacionCalculadora(id)
          if (result?.success) {
            showSuccess('Cotización vinculada', 'La cotización ya quedó asociada. Los documentos deberían habilitarse.')
          } else {
            showError('Error al vincular', result?.message || 'No se pudo vincular la cotización.')
          }
        } catch (error: any) {
          showError('Error al vincular', error?.message || 'No se pudo vincular la cotización.')
        }
      }, 'Vinculando cotización...')
    },
    () => {
      // cancel
    }
  )
}

const handleDuplicate = (id: string) => {
  showConfirmation('Duplicar Cotización', '¿Estás seguro de que deseas duplicar esta cotización?',
    async () => {
      await withSpinner(async () => {
        const result = await duplicateCotizacionCalculadora(Number(id))
        if (result.success) {
          showSuccess('Cotización duplicada correctamente', 'La cotización ha sido duplicada correctamente')
          await getCotizaciones()
        } else {
          showError('Error al duplicar la cotización', 'Error al duplicar la cotización')
        }
      })
    },
    () => {
      
    }
  )
}
const handleSend = (id: string) => {
  moveCotizacionModal.open({
    cotizacionId: Number(id),
    show: true,
    isFromCalculadora: true,
    onMoved: () => {
      getCotizaciones()
    }
  })
}
const handleExport = async () => {
  try {
    await withSpinner(async () => {
      const result = await exportCotizacionesList()
      if (result.success) {
        showSuccess('Exportado', 'El listado se descargó correctamente.', { duration: 3000 })
      } else {
        showError('Error al exportar', result.error ?? 'No se pudo exportar el listado.')
      }
    }, 'Exportando...')
  } catch (e: any) {
    showError('Error al exportar', e?.message ?? 'No se pudo exportar.')
  }
}

function parseIdCalculadoraQuery(q: unknown): number | null {
  const s = typeof q === 'string' ? q : Array.isArray(q) ? q[0] : ''
  if (!s || !/^\d+$/.test(String(s))) return null
  const n = Number(s)
  return n > 0 ? n : null
}

watch(
  () => route.query.idCalculadora,
  async (q) => {
    if (route.path !== '/cotizaciones') return
    const id = parseIdCalculadoraQuery(q)
    if (id == null) return
    search.value = String(id)
    pagination.value.current_page = 1
    await getCotizaciones({ id_calculadora: id })
    await navigateTo({ path: '/cotizaciones' }, { replace: true })
  },
  { immediate: true }
)

onMounted(async () => {
  loadRazones()
  if (!parseIdCalculadoraQuery(route.query.idCalculadora)) {
    await getCotizaciones()
  }
})

// Configuración de filtros para DataTable
const filterConfig = computed<FilterConfig[]>(() => [
  {
    key: 'fecha_inicio',
    label: 'Fecha Inicio',
    type: 'date',
    placeholder: 'DD/MM/YYYY',
    options: []
  },
  {
    key: 'fecha_fin',
    label: 'Fecha Fin',
    type: 'date',
    placeholder: 'DD/MM/YYYY',
    options: []
  },
  {
    key: 'anio',
    label: 'Año',
    type: 'select',
    placeholder: 'Seleccionar año',
    options: [
      { label: 'Todos', value: 'todos' },
      ...Array.from({ length: new Date().getFullYear() - 2024 + 1 }, (_, i) => {
        const year = String(new Date().getFullYear() - i)
        return { label: year, value: year }
      })
    ]
  },
  {
    key: 'campania',
    label: 'Campaña',
    type: 'select',
    placeholder: 'Seleccionar campaña',
    options: [
      { label: 'Todas', value: 'todas' },
      ...(filterOptions.value.contenedores || []).map((item: any) => ({
        label: `Contenedor #${item.label}`,
        value: item.value.toString()
      }))
    ]
  },
  {
    key: 'estado_calculadora',
    label: 'Estado',
    type: 'select',
    placeholder: 'Seleccionar estado',
    options: [
      { label: 'Todos', value: 'todos' },
      ...(filterOptions.value.estadoCalculadora || []).map((item: any) => ({
        label: item.label,
        value: item.value.toString()
      }))
    ]
  },
  {
    key: 'vendedor',
    label: 'Vendedor',
    type: 'select',
    placeholder: 'Seleccionar vendedor',
    options: [
      { label: 'Todos', value: 'todos' },
      ...(filterOptions.value.vendedores || []).map((item: any) => ({
        label: item.label ?? item.nombre ?? `Usuario ${item.value}`,
        value: String(item.value ?? item.id)
      }))
    ]
  },
  {
    key: 'proveedores_vinculados',
    label: 'Vinculación proveedores',
    type: 'select',
    placeholder: 'Seleccionar vinculación',
    options: [
      { label: 'Todos', value: 'todos' },
      { label: 'Desvinculadas', value: 'desvinculadas' },
      { label: 'Vinculadas', value: 'vinculadas' }
    ]
  }
])
</script>