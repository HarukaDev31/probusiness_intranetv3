/** Un pago/evidencia del viático (concepto, monto, archivo) */
export interface ViaticoPago {
  id: number
  viatico_id: number
  concepto: string
  monto: string
  file_path?: string | null
  file_url?: string | null
  file_size?: number | null
  file_original_name?: string | null
  file_mime_type?: string | null
  file_extension?: string | null
  created_at?: string
  updated_at?: string
}

export interface Viatico {
  id: number
  subject: string
  reimbursement_date: string
  requesting_area: string
  expense_description: string
  total_amount: number | string
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED'
  receipt_file: string | null
  payment_receipt_file: string | null
  return_date: string | null
  user_id: number
  created_at: string
  updated_at: string
  url_comprobante?: string | null
  url_payment_receipt?: string | null
  nombre_usuario?: string
  usuario?: {
    ID_Usuario: number
    No_Nombres_Apellidos: string
  }
  /** Evidencias por concepto (múltiples items de pago) */
  pagos?: ViaticoPago[]
}

/** Un item de pago: concepto, monto y comprobante. id solo para pagos existentes (edición). */
export interface ViaticoPaymentItem {
  concepto: string
  monto: number
  receipt_file?: File | null
  /** Id del pago en backend; solo enviar cuando es un pago existente (editar) */
  id?: number
  /** URL del archivo ya guardado en BD; enviar cuando es item existente y no se sube archivo nuevo */
  existing_file_url?: string | null
}

export interface CreateViaticoRequest {
  subject: string
  reimbursement_date: string
  requesting_area: string
  /** Descripción general del gasto (opcional si se usan items) */
  expense_description: string
  /** Monto total (suma de items si se usa items[]) */
  total_amount: number
  /** @deprecated Use items[].receipt_file. Un solo comprobante (compatibilidad) */
  receipt_file?: File | null
  /** Id del viático; solo enviar en edición (usa mismo endpoint create) */
  id?: number
  /** Items de pago: concepto, monto, comprobante; id solo si es pago existente */
  items?: ViaticoPaymentItem[]
}

export interface UpdateViaticoRequest {
  status?: 'PENDING' | 'CONFIRMED' | 'REJECTED'
  receipt_file?: File | null
  payment_receipt_file?: File | null // Comprobante de retribución subido por admin
  delete_file?: boolean
  /** Actualizar datos del viático (mismo payload que create) */
  subject?: string
  reimbursement_date?: string
  requesting_area?: string
  expense_description?: string
  total_amount?: number
  items?: ViaticoPaymentItem[]
}

export interface ViaticosResponse {
  success: boolean
  data: Viatico[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

export interface ViaticoResponse {
  success: boolean
  data: Viatico
  message?: string
}

export interface ViaticoFilters {
  status?: 'PENDING' | 'CONFIRMED' | 'REJECTED'
  fecha_inicio?: string
  fecha_fin?: string
  search?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}
