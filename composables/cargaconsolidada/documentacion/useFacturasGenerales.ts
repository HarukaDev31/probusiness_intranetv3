import { ref } from 'vue'
import { FacturaComercialBatchService } from '~/services/cargaconsolidada/documentacion/facturaComercialBatchService'
import type { FacturaComercialBatch } from '~/types/cargaconsolidada/documentacion/factura-comercial-batch'

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

export const downloadFacturaComercialBatchFile = async (id: number, filename?: string | null) => {
  const blob = await FacturaComercialBatchService.download(id)
  triggerBlobDownload(blob, filename || `factura_procesada_${id}.xlsx`)
}

export const useFacturasGenerales = () => {
  const loading = ref(false)
  const enqueueing = ref(false)
  const batches = ref<FacturaComercialBatch[]>([])
  const error = ref<string | null>(null)

  const loadBatches = async (idContenedor: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await FacturaComercialBatchService.listByContenedor(idContenedor)
      batches.value = response?.data || []
      return { success: true }
    } catch (err: any) {
      error.value = err?.message || 'No se pudo cargar el historial.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const enqueueGeneration = async (idContenedor: number) => {
    enqueueing.value = true
    try {
      return await FacturaComercialBatchService.enqueue(idContenedor)
    } finally {
      enqueueing.value = false
    }
  }

  const downloadBatch = async (row: FacturaComercialBatch) => {
    await downloadFacturaComercialBatchFile(row.id, row.nombre_archivo)
  }

  return {
    loading,
    enqueueing,
    batches,
    error,
    loadBatches,
    enqueueGeneration,
    downloadBatch
  }
}
