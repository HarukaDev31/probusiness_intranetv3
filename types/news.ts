export type SolicitadaPor = 
  | 'CEO'
  | 'EQUIPO_DE_COORDINACION'
  | 'EQUIPO_DE_VENTAS'
  | 'EQUIPO_DE_CURSO'
  | 'EQUIPO_DE_DOCUMENTACION'
  | 'ADMINISTRACION'
  | 'EQUIPO_DE_TI'
  | 'EQUIPO_DE_MARKETING'

export interface SystemNews {
  id: number
  title: string
  content: string
  summary?: string | null
  type: 'update' | 'feature' | 'fix' | 'announcement'
  solicitada_por?: SolicitadaPor | null
  is_published: boolean
  published_at?: string | null
  redirect?: string | null
  created_by: number
  created_by_name?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface CreateNewsRequest {
  title: string
  content: string
  summary?: string
  type: 'update' | 'feature' | 'fix' | 'announcement'
  solicitada_por?: SolicitadaPor
  is_published?: boolean
  published_at?: string
  redirect?: string
}

export interface UpdateNewsRequest {
  title?: string
  content?: string
  summary?: string
  type?: 'update' | 'feature' | 'fix' | 'announcement'
  solicitada_por?: SolicitadaPor
  is_published?: boolean
  published_at?: string
  redirect?: string
}

export interface NewsListResponse {
  success: boolean
  data: SystemNews[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  message?: string
  error?: string
}

export interface NewsResponse {
  success: boolean
  data: SystemNews
  message?: string
  error?: string
}

export interface NewsFilters {
  type?: 'update' | 'feature' | 'fix' | 'announcement'
  solicitada_por?: SolicitadaPor
  is_published?: boolean
  per_page?: number
  page?: number
}

