<template>
  <div class="md:p-6">
    <PageHeader
      title="Ver plantillas finales"
      :subtitle="carga ? `Consolidado #${carga}` : ''"
      icon=""
      :hide-back-button="false"
      @back="handleBack"
    />

    <DataTable
      title="Historial de generaciones"
      :show-title="true"
      icon="i-heroicons-document-duplicate"
      :data="batches"
      :columns="columns"
      :loading="loading"
      :show-pagination="false"
      :show-primary-search="false"
      :show-filters="false"
      :show-export="false"
      empty-state-message="Aún no hay plantillas finales generadas para este consolidado."
    />

    <PlantillasFinalesDetalleModal
      v-model:open="detalleModalOpen"
      :detalle="detalleSeleccionado"
      :resumen="detalleResumen"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, onUnmounted, ref, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { PlantillasFinalesViewProps } from './types'
import type {
  PlantillaFinalBatch,
  PlantillaFinalBatchDetalleJson,
  PlantillaFinalBatchEstado
} from '~/types/cargaconsolidada/cotizacion-final/plantilla-final-batch'
import PlantillasFinalesDetalleModal from '~/components/cargaconsolidada/cotizacion-final/PlantillasFinalesDetalleModal/index.vue'
import { ESTADO_COLORS, ESTADO_LABELS } from './constants'
import { usePlantillasFinales } from '~/composables/cargaconsolidada/cotizacion-final/usePlantillasFinales'
import { useGeneral } from '~/composables/cargaconsolidada/cotizacion-final/useGeneral'

const props = withDefaults(defineProps<PlantillasFinalesViewProps>(), {
  backBasePath: undefined
})

const route = useRoute()
const idContenedor = computed(() => Number(route.params.id))
const backBasePath = computed(() => props.backBasePath || props.basePath)

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const { loading, batches, loadBatches, downloadPlantilla, downloadZip } = usePlantillasFinales()
const { carga, getHeaders } = useGeneral()

const detalleModalOpen = ref(false)
const detalleSeleccionado = ref<PlantillaFinalBatchDetalleJson>({ exitosos: [], fallidos: [] })
const detalleResumen = ref('')

const emptyDetalle = (): PlantillaFinalBatchDetalleJson => ({
  exitosos: [],
  fallidos: []
})

const normalizeDetalle = (row: PlantillaFinalBatch): PlantillaFinalBatchDetalleJson => {
  const raw = row.detalle_json
  if (raw && (Array.isArray(raw.exitosos) || Array.isArray(raw.fallidos))) {
    return {
      exitosos: Array.isArray(raw.exitosos) ? raw.exitosos : [],
      fallidos: Array.isArray(raw.fallidos) ? raw.fallidos : []
    }
  }
  return emptyDetalle()
}

const canVerDetalle = (row: PlantillaFinalBatch) => {
  if (row.estado === 'PENDING') return false
  const d = normalizeDetalle(row)
  if (d.exitosos.length || d.fallidos.length) return true
  return (row.clientes_completados + row.clientes_error) > 0
}

const openDetalleModal = (row: PlantillaFinalBatch) => {
  detalleSeleccionado.value = normalizeDetalle(row)
  detalleResumen.value = row.detalle || `${row.clientes_completados} exitosos / ${row.clientes_error} con error`
  detalleModalOpen.value = true
}

const formatDate = (raw: string | null) => {
  if (!raw) return '—'
  try {
    return new Date(raw).toLocaleString('es-PE')
  } catch {
    return raw
  }
}

const handleBack = () => {
  void navigateTo(`${backBasePath.value}/cotizacion-final/${idContenedor.value}`)
}

const onRealtimeFinished = (event: Event) => {
  const detail = (event as CustomEvent).detail as { id_contenedor?: number }
  if (detail?.id_contenedor && Number(detail.id_contenedor) !== idContenedor.value) return
  void loadBatches(idContenedor.value)
}

const columns: TableColumn<PlantillaFinalBatch>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => row.original.id
  },
  {
    accessorKey: 'nombre_plantilla',
    header: 'Plantilla',
    cell: ({ row }) => {
      const r = row.original
      if (!r.has_plantilla) {
        return h('span', { class: 'text-gray-400 text-xs' }, '—')
      }
      return h(UButton as any, {
        size: 'xs',
        color: 'primary',
        variant: 'ghost',
        icon: 'i-heroicons-arrow-down-tray',
        label: r.nombre_plantilla || 'Descargar',
        onClick: () => { void downloadPlantilla(r) }
      })
    }
  },
  {
    accessorKey: 'zip_path',
    header: 'ZIP generado',
    cell: ({ row }) => {
      const r = row.original
      if (!r.has_zip || r.estado === 'PENDING') {
        return h('span', { class: 'text-gray-400 text-xs' }, r.estado === 'PENDING' ? 'En proceso…' : '—')
      }
      return h(UButton as any, {
        size: 'xs',
        color: 'primary',
        variant: 'ghost',
        icon: 'i-heroicons-archive-box-arrow-down',
        label: 'Descargar ZIP',
        onClick: () => { void downloadZip(r) }
      })
    }
  },
  {
    accessorKey: 'detalle',
    header: 'Detalle',
    cell: ({ row }) => {
      const r = row.original
      const resumen = r.detalle || `${r.clientes_completados} exitosos / ${r.clientes_error} con error`
      const children = [
        h('span', { class: 'text-xs' }, resumen)
      ]
      if (canVerDetalle(r)) {
        children.push(
          h(UButton as any, {
            size: 'xs',
            color: 'neutral',
            variant: 'ghost',
            icon: 'i-heroicons-eye',
            class: 'ml-1 shrink-0',
            title: 'Ver detalle por cliente',
            onClick: () => openDetalleModal(r)
          })
        )
      }
      return h('div', { class: 'flex items-center gap-1 flex-wrap' }, children)
    }
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const estado = row.original.estado as PlantillaFinalBatchEstado
      return h(UBadge as any, {
        color: ESTADO_COLORS[estado] || 'neutral',
        variant: 'soft',
        label: ESTADO_LABELS[estado] || estado
      })
    }
  },
  {
    accessorKey: 'fecha_inicio',
    header: 'Inicio',
    cell: ({ row }) => formatDate(row.original.fecha_inicio)
  },
  {
    accessorKey: 'fecha_fin',
    header: 'Fin',
    cell: ({ row }) => formatDate(row.original.fecha_fin)
  }
]

onMounted(async () => {
  if (!Number.isFinite(idContenedor.value)) return
  await getHeaders(idContenedor.value)
  await loadBatches(idContenedor.value)
  if (import.meta.client) {
    window.addEventListener('plantilla-final-batch-finished', onRealtimeFinished as EventListener)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('plantilla-final-batch-finished', onRealtimeFinished as EventListener)
  }
})
</script>
