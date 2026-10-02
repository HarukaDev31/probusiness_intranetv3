<template>
  <UDropdownMenu :items="items">
    <UButton
      label="Reporte marketing"
      icon="i-heroicons-arrow-down-tray"
      trailing-icon="i-heroicons-chevron-down"
      color="success"
      class="py-3"
    />
  </UDropdownMenu>
</template>

<script setup lang="ts">
import ConsolidadoService from '~/services/cargaconsolidada/consolidadoService'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'

type TipoReporte = 'preliminar' | 'final'

const props = withDefaults(defineProps<{
  idContenedor: number
  carga?: string | number
  /** Reportes disponibles (abiertos: solo preliminar; completados: preliminar y final). */
  tipos?: TipoReporte[]
}>(), {
  carga: undefined,
  tipos: () => ['preliminar', 'final'],
})

const { withSpinner } = useSpinner()
const { showError } = useModal()

const descargar = async (tipo: TipoReporte) => {
  try {
    await withSpinner(async () => {
      const blob = await ConsolidadoService.downloadReporteMarketing(props.idContenedor, tipo)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `reporte_marketing_${tipo}_consolidado_${props.carga ?? props.idContenedor}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }, 'Generando reporte...')
  } catch (error: any) {
    showError('Error al descargar', error?.message || 'No se pudo generar el reporte de marketing.')
  }
}

const OPCIONES: Record<TipoReporte, { label: string; icon: string }> = {
  preliminar: { label: 'Reporte cotización preliminar', icon: 'i-heroicons-document-arrow-down' },
  final: { label: 'Reporte cotización final', icon: 'i-heroicons-document-check' },
}

const items = computed(() => [
  props.tipos.map((tipo) => ({
    label: OPCIONES[tipo].label,
    icon: OPCIONES[tipo].icon,
    onSelect: () => descargar(tipo),
  })),
])
</script>
