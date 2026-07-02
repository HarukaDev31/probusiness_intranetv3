import type { PlantillaFinalBatchEstado } from '~/types/cargaconsolidada/cotizacion-final/plantilla-final-batch'

export const ESTADO_LABELS: Record<PlantillaFinalBatchEstado, string> = {
  PENDING: 'Pendiente',
  COMPLETED: 'Completado',
  FAILED: 'Error'
}

export const ESTADO_COLORS: Record<PlantillaFinalBatchEstado, 'warning' | 'success' | 'error' | 'neutral'> = {
  PENDING: 'warning',
  COMPLETED: 'success',
  FAILED: 'error'
}
