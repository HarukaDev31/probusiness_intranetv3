export type PlantillaFinalBatchEstado = 'PENDING' | 'COMPLETED' | 'FAILED'

export interface PlantillaFinalBatchClienteExitoso {
  nombre: string
  id_cotizacion?: number
  archivo?: string | null
}

export interface PlantillaFinalBatchClienteFallido {
  nombre: string
  motivo: string
}

export interface PlantillaFinalBatchDetalleJson {
  exitosos: PlantillaFinalBatchClienteExitoso[]
  fallidos: PlantillaFinalBatchClienteFallido[]
}

export interface PlantillaFinalBatch {
  id: number
  id_contenedor: number
  clientes_excel: number
  clientes_completados: number
  clientes_error: number
  detalle: string
  detalle_json?: PlantillaFinalBatchDetalleJson
  estado: PlantillaFinalBatchEstado
  fecha_inicio: string | null
  fecha_fin: string | null
  created_by: number | null
  plantilla_url: string | null
  zip_path: string | null
  nombre_plantilla: string | null
  has_plantilla: boolean
  has_zip: boolean
  mensaje_error: string | null
  created_at: string | null
}

export interface PlantillaFinalBatchListResponse {
  success: boolean
  data: PlantillaFinalBatch[]
  message?: string
}

export interface PlantillaFinalBatchEnqueueResponse {
  success: boolean
  message?: string
  data?: {
    batch_id: number
    estado: string
    id_contenedor: number
  }
}
