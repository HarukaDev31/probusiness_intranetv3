export interface CotizacionResumenCosto {
  concepto: string
  valor: number | null
}

export interface CotizacionResumenClienteExtraido {
  nombre: string | null
  tipo_documento: 'ID' | 'RUC' | null
  documento: string | null
  whatsapp: string | null
  correo: string | null
}

export interface CotizacionResumenProveedorExtraido {
  cbm_total: number | null
  peso_total: number | null
  qty_cajas: number | null
  unidades: number | null
  incoterm: string | null
  productos: string | null
  costos: CotizacionResumenCosto[]
}

export interface CotizacionResumenArchivo {
  path: string
  nombre_original: string
  mime_type: string
  size: number
}

export interface ExtraerDocumentoResponse {
  success: boolean
  extracted_by_ai: boolean
  message: string | null
  data: {
    cliente: CotizacionResumenClienteExtraido
    proveedores: CotizacionResumenProveedorExtraido[]
  } | null
  archivo: CotizacionResumenArchivo | null
}

export interface CrearCotizacionResumenRequest {
  id_contenedor?: number | null
  id_usuario: number
  cliente: {
    nombre: string
    tipo_documento?: 'ID' | 'RUC'
    documento?: string
    whatsapp?: string
    correo?: string
  }
  proveedores: {
    id?: number
    cbm_total: number
    cbm_imo?: number
    peso_total?: number
    qty_cajas?: number
    productos: string
    unidades?: number
    incoterm?: string
    moneda?: string
    costos?: { concepto: string; valor: number }[]
  }[]
  descuento?: number
  archivo?: CotizacionResumenArchivo | null
}

export interface CotizacionResumenDetalle {
  id: number
  estado: CotizacionResumenEstado
  id_contenedor: number | null
  id_usuario: number | null
  descuento: number
  cliente: {
    nombre: string | null
    tipo_documento: 'ID' | 'RUC'
    documento: string | null
    whatsapp: string | null
    correo: string | null
  }
  archivo: {
    path: string
    nombre_original: string | null
    url: string | null
  } | null
  proveedores: {
    id: number
    code_supplier: string | null
    cbm_total: number
    cbm_imo: number
    peso_total: number | string | null
    qty_cajas: number | null
    productos: string | null
    unidades: number | null
    incoterm: string | null
    moneda: string | null
    costos: CotizacionResumenCosto[]
  }[]
}

export interface CotizacionResumenProveedorRow {
  id: number
  code_supplier?: string | null
  estado_china: string | null
  producto: string | null
  volumen_cbm: number | string | null
  cbm_normal: number | string | null
  cbm_imo: number | string | null
  peso_total: number | string | null
  qty_cajas: number | null
  unidades: number | null
  incoterm: string | null
  moneda: string | null
  costo_unitario_estimado: number | string | null
  inversion_total: number | string | null
  costos: CotizacionResumenCosto[]
}

export type CotizacionResumenEstado = 'COTIZADO' | 'CONFIRMADO'

export interface CotizacionResumenRow {
  id: number
  fecha: string | null
  nombre: string | null
  documento: string | null
  telefono: string | null
  correo: string | null
  estado: CotizacionResumenEstado
  id_contenedor: number | null
  contenedor: string | null
  campania: string | null
  id_usuario: number | null
  vendedor: string | null
  total_cbm: number
  total_cajas: number
  total_inversion: number
  fob: number
  logistica: number
  impuesto: number
  tarifa: number
  descuento: number
  cod_cotizacion: string | null
  cod_contract: string | null
  cotizacion_file_url: string | null
  url_cotizacion_pdf: string | null
  archivo_url: string | null
  archivo_nombre: string | null
  proveedores: CotizacionResumenProveedorRow[]
}

export interface CotizacionResumenListResponse {
  success: boolean
  data: CotizacionResumenRow[]
  message?: string
  pagination?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface CotizacionResumenSimpleResponse {
  success: boolean
  message?: string
  data?: any
}

export interface CotizacionResumenFilters {
  fecha_inicio?: string
  fecha_fin?: string
  estado?: string
  id_contenedor?: number
  id_usuario?: number
  estado_china?: string
  search?: string
  page?: number
  per_page?: number
}
