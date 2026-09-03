export type LandingLeadPagination = {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export type LandingConsolidadoFormSource = 'landing_consolidado_v2' | 'probusiness_pe'

export type LandingCursoFormSource = 'landing_curso_v2' | 'probusiness_pe'

export type LandingConsolidadoLead = {
  id: number
  nombre: string
  whatsapp: string
  proveedor: 'si' | 'no' | 'buscando'
  codigo_campana?: string | null
  form_source?: LandingConsolidadoFormSource | string | null
  ip_address?: string | null
  created_at: string
}

export type LandingCursoLead = {
  id: number
  nombre: string
  whatsapp: string
  email: string
  experiencia_importando: 'si' | 'no' | 'poca'
  codigo_campana?: string | null
  form_source?: LandingCursoFormSource | string | null
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

