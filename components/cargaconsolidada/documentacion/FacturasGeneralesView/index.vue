<template>
  <div class="md:p-6">
    <PageHeader
      title="Ver facturas generales"
      :subtitle="idContenedor ? `Consolidado #${idContenedor}` : ''"
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
      empty-state-message="Aún no hay facturas generales generadas para este consolidado."
    />
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, onUnmounted, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { FacturasGeneralesViewProps } from './types'
import type {
  FacturaComercialBatch,
  FacturaComercialBatchEstado
} from '~/types/cargaconsolidada/documentacion/factura-comercial-batch'
import { ESTADO_COLORS, ESTADO_LABELS } from './constants'
import { useFacturasGenerales } from '~/composables/cargaconsolidada/documentacion/useFacturasGenerales'
import { FACTURA_COMERCIAL_BATCH_FINISHED_EVENT } from '~/composables/cargaconsolidada/documentacion/facturaComercialBatchRealtime'

const props = withDefaults(defineProps<FacturasGeneralesViewProps>(), {
  backBasePath: undefined
})

const route = useRoute()
const idContenedor = computed(() => Number(route.params.id))
const backBasePath = computed(() => props.backBasePath || props.basePath)

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const { loading, batches, loadBatches, downloadBatch } = useFacturasGenerales()

const formatDate = (raw: string | null) => {
  if (!raw) return '—'
  try {
    return new Date(raw).toLocaleString('es-PE')
  } catch {
    return raw
  }
}

const handleBack = () => {
  void navigateTo(`${backBasePath.value}/documentacion/${idContenedor.value}`)
}

const onRealtimeFinished = (event: Event) => {
  const detail = (event as CustomEvent).detail as { id_contenedor?: number }
  if (detail?.id_contenedor && Number(detail.id_contenedor) !== idContenedor.value) return
  void loadBatches(idContenedor.value)
}

const columns: TableColumn<FacturaComercialBatch>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => row.original.id
  },
  {
    accessorKey: 'nombre_archivo',
    header: 'Archivo',
    cell: ({ row }) => {
      const r = row.original
      if (!r.has_file || r.estado !== 'COMPLETED') {
        return h('span', { class: 'text-gray-400 text-xs' }, r.estado === 'PENDING' ? 'En proceso…' : '—')
      }
      return h(UButton as any, {
        size: 'xs',
        color: 'primary',
        variant: 'ghost',
        icon: 'i-heroicons-arrow-down-tray',
        label: r.nombre_archivo || 'Descargar',
        onClick: () => { void downloadBatch(r) }
      })
    }
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const estado = row.original.estado as FacturaComercialBatchEstado
      return h(UBadge as any, {
        color: ESTADO_COLORS[estado] || 'neutral',
        variant: 'soft',
        label: ESTADO_LABELS[estado] || estado
      })
    }
  },
  {
    accessorKey: 'mensaje_error',
    header: 'Detalle',
    cell: ({ row }) => {
      const r = row.original
      if (r.estado === 'FAILED') {
        return h('span', { class: 'text-xs text-red-600 dark:text-red-400' }, r.mensaje_error || 'Falló la generación')
      }
      if (r.estado === 'COMPLETED') {
        return h('span', { class: 'text-xs text-gray-500' }, 'Lista para descargar')
      }
      return h('span', { class: 'text-xs text-gray-400' }, 'Generando…')
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
  await loadBatches(idContenedor.value)
  if (import.meta.client) {
    window.addEventListener(FACTURA_COMERCIAL_BATCH_FINISHED_EVENT, onRealtimeFinished as EventListener)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener(FACTURA_COMERCIAL_BATCH_FINISHED_EVENT, onRealtimeFinished as EventListener)
  }
})
</script>
