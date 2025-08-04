export interface EstadoDisponible {
  value: string
  label: string
}

export interface Concepto {
  id: number
  name: string
}

export interface PagoDetalle {
  id: number
  monto: number
  monto_formateado: string
  concepto: string
  status: string
  payment_date: string
}

export interface PagoDetalleItem {
  id: number
  id_contenedor: number
  id_cotizacion: number
  id_concept: number
  monto: string
  voucher_url: string
  payment_date: string
  banco: string
  created_at: string | null
  is_confirmed: boolean
  status: string
  concepto: Concepto
}

export interface ConsolidadoItem {
  id: number
  index: number
  fecha: string
  nombre: string
  documento: string
  telefono: string
  tipo: string
  carga: string
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

export interface ConsolidadoResponse {
  success: boolean
  data: ConsolidadoItem[]
  pagination: PaginationInfo
}

export interface PagoDetalleResponse {
  monto_a_pagar_formateado: string
  total_pagado: number
  total_a_pagar: number
  success: boolean
  data: PagoDetalleItem[]
  nota: string
  cotizacion_inicial_url: string
  cotizacion_final_url: string
}

export interface ConsolidadoFilters {
  fecha_inicio?: string
  fecha_fin?: string
  estado?: string
  carga?: string
  search?: string
} 