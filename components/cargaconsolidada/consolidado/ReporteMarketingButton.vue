<template>
  <UDropdownMenu :items="items">
    <UButton
      size="xs"
      icon="vscode-icons:file-type-excel"
      color="success"
      variant="ghost"
      title="Descargar reporte de marketing"
    />
  </UDropdownMenu>
</template>

<script setup lang="ts">
import ConsolidadoService from '~/services/cargaconsolidada/consolidadoService'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'

type TipoReporte = 'preliminar' | 'final'

const props = defineProps<{
  idContenedor: number
  carga?: string | number
}>()

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

const items = [[
  {
    label: 'Reporte cotización preliminar',
    icon: 'i-heroicons-document-arrow-down',
    onSelect: () => descargar('preliminar'),
  },
  {
    label: 'Reporte cotización final',
    icon: 'i-heroicons-document-check',
    onSelect: () => descargar('final'),
  },
]]
</script>
