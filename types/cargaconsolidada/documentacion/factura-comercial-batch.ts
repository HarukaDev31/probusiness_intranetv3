export type FacturaComercialBatchEstado = 'PENDING' | 'COMPLETED' | 'FAILED'

export interface FacturaComercialBatch {
  id: number
  id_contenedor: number
  estado: FacturaComercialBatchEstado
  fecha_inicio: string | null
  fecha_fin: string | null
  created_by: number | null
  file_path: string | null
  nombre_archivo: string | null
  has_file: boolean
  mensaje_error: string | null
  created_at: string | null
}

export interface FacturaComercialBatchListResponse {
  success: boolean
  data: FacturaComercialBatch[]
  message?: string
}

export interface FacturaComercialBatchEnqueueResponse {
  success: boolean
  message?: string
  data?: {
    batch_id: number
    estado: string
    id_contenedor: number
    already_queued?: boolean
  }
}
