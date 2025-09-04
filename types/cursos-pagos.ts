export interface EstadoDisponible {
  value: string
  label: string
}

export interface Concepto {
  id: number
  name: string
  description?: string
}

export interface PagoDetalle {
  id: number
  monto: number
  monto_formateado: string
  status: string
}

export interface PagoDetalleItem {
  id: number
  id_pedido_curso: number
  id_concept: number
  monto: string
  status: string
  payment_date: string
  concepto: Concepto
}

export interface CursoItem {
  id: number
  index: number
  fecha_registro: string
  nombre: string
  telefono: string
  tipo: string
  campana: string
  estado_pago: string
  estados_disponibles: EstadoDisponible[]
  monto_a_pagar: number
  monto_a_pagar_formateado: string
  total_pagado: number
  total_pagado_formateado: string
  pagos_detalle: PagoDetalle[]
  note_administracion?: string
}

export interface PaginationInfo {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

export interface CursosResponse {
  success: boolean
  data: CursoItem[]
  pagination: PaginationInfo
  campanas_disponibles: { id: number; nombre: string }[]
}

export interface CursosDetalleResponse {
  success: boolean
  data: PagoDetalleItem[]
  nota: string
  total_a_pagar: number
  total_a_pagar_formateado: string
  total_pagado: number
  total_pagado_formateado: string
}

export interface CursosFilters {
  Filtro_Fe_Inicio?: string
  Filtro_Fe_Fin?: string
  campana?: number
  estado_pago?: string
  search?: string
} 