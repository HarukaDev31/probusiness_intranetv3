import type { FacturaComercialBatchEstado } from '~/types/cargaconsolidada/documentacion/factura-comercial-batch'

export const ESTADO_LABELS: Record<FacturaComercialBatchEstado, string> = {
  PENDING: 'En proceso',
  COMPLETED: 'Completado',
  FAILED: 'Error'
}

export const ESTADO_COLORS: Record<FacturaComercialBatchEstado, 'warning' | 'success' | 'error' | 'neutral'> = {
  PENDING: 'warning',
  COMPLETED: 'success',
  FAILED: 'error'
}
