export type DocumentacionObservacionCategoria =
  | 'factura_comercial'
  | 'packing_list'
  | 'excel_confirmacion'
  | 'general'

export interface DocumentacionObservacion {
  id: number
  id_proveedor: number
  categoria: DocumentacionObservacionCategoria
  mensaje: string
  user_id: number
  user_name: string
  created_at: string | null
}

export interface DocumentacionObservacionListResponse {
  success: boolean
  data: DocumentacionObservacion[]
}

export interface DocumentacionObservacionCreateRequest {
  categoria: DocumentacionObservacionCategoria
  mensaje: string
}

export interface DocumentacionObservacionCreateResponse {
  success: boolean
  data: DocumentacionObservacion
}

export interface DocumentacionExpedienteObservacionWsPayload {
  id_proveedor: number
  observacion: DocumentacionObservacion
}
