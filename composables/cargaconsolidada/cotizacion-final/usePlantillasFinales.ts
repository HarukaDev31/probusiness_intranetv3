import { ref } from 'vue'
import { PlantillaFinalBatchService } from '~/services/cargaconsolidada/cotizacion-final/plantillaFinalBatchService'
import type { PlantillaFinalBatch } from '~/types/cargaconsolidada/cotizacion-final/plantilla-final-batch'

const triggerBlobDownload = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

export const usePlantillasFinales = () => {
  const loading = ref(false)
  const batches = ref<PlantillaFinalBatch[]>([])
  const error = ref<string | null>(null)

  const loadBatches = async (idContenedor: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await PlantillaFinalBatchService.listByContenedor(idContenedor)
      batches.value = response?.data || []
      return { success: true }
    } catch (err: any) {
      error.value = err?.message || 'No se pudo cargar el historial.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const downloadPlantilla = async (row: PlantillaFinalBatch) => {
    const blob = await PlantillaFinalBatchService.downloadPlantilla(row.id)
    const name = row.nombre_plantilla || `plantilla_${row.id}.xlsx`
    triggerBlobDownload(blob, name)
  }

  const downloadZip = async (row: PlantillaFinalBatch) => {
    const blob = await PlantillaFinalBatchService.downloadZip(row.id)
    triggerBlobDownload(blob, `Boletas_${row.id_contenedor}_${row.id}.zip`)
  }

  return {
    loading,
    batches,
    error,
    loadBatches,
    downloadPlantilla,
    downloadZip
  }
}
