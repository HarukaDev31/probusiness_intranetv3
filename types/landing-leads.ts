export type LandingLeadPagination = {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export type LandingConsolidadoLead = {
  id: number
  nombre: string
  whatsapp: string
  proveedor: 'si' | 'no' | 'buscando'
  codigo_campana?: string | null
  ip_address?: string | null
  created_at: string
}

export type LandingCursoLead = {
  id: number
  nombre: string
  whatsapp: string
  email: string
  experiencia_importando: 'si' | 'no' | 'poca'
  ip_address?: string | null
  created_at: string
}

export type LandingConsolidadoLeadsResponse = {
  success: boolean
  data: LandingConsolidadoLead[]
  pagination: LandingLeadPagination
}

export type LandingCursoLeadsResponse = {
  success: boolean
  data: LandingCursoLead[]
  pagination: LandingLeadPagination
}

