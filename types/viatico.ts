export interface Viatico {
  id: number
  subject: string
  reimbursement_date: string
  requesting_area: string
  expense_description: string
  total_amount: number
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED'
  receipt_file: string | null // Archivo inicial subido por el usuario
  payment_receipt_file: string | null // Comprobante de retribución subido por admin
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
}

export interface CreateViaticoRequest {
  subject: string
  reimbursement_date: string
  requesting_area: string
  expense_description: string
  total_amount: number
  receipt_file?: File | null
}

export interface UpdateViaticoRequest {
  status?: 'PENDING' | 'CONFIRMED' | 'REJECTED'
  receipt_file?: File | null // Para el archivo inicial (no se usa en update)
  payment_receipt_file?: File | null // Comprobante de retribución subido por admin
  delete_file?: boolean
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
