export interface PagoProveedorCodigoCc {
  id_proveedor_cc: number
  code_supplier: string
  producto?: string | null
  nombre?: string | null
}

export interface PagoProveedorBusquedaCc {
  cod_cotizacion_cc: string
  calculadora_importacion_id: number
  id_cotizacion_cc: number | null
  cliente: {
    nombre: string | null
    documento: string | null
    whatsapp: string | null
    correo: string | null
  }
  consolidado: string | null
  proveedores: PagoProveedorCodigoCc[]
  ya_usada: boolean
  aviso: string | null
}

export interface PagoProveedorCalculoLinea {
  orden: number
  moneda: string
  modalidad_abono: string
  modalidad_pago: string
  valor_carga_usd: number
  bancaria: number
  administrativa: number
  total: number
  total_ahora: number
  etiqueta_bancaria: string | null
  cuotas: Array<{ numero: number; porcentaje: number; carga: number; bancaria: number; administrativa: number; total: number }>
  pagos_proveedor: Array<{ numero: number; porcentaje: number; carga: number }>
}

export interface PagoProveedorProveedor {
  id?: number
  orden: number
  code_supplier: string | null
  nombre_proveedor: string | null
  producto: string | null
  moneda: 'RMB' | 'USD'
  tipo_pago: 'transferencia' | 'tt' | 'tarjeta'
  valor_carga_usd: number
  modalidad_abono: 'total' | 'fraccionado'
  modalidad_pago: 'total' | 'fraccionado'
  porcentaje_1: number
  porcentaje_2: number | null
  fecha_cuota_2: string | null
  comision_bancaria: boolean
  comision_administrativa: boolean
  proforma_nombre?: string | null
  proforma_url?: string | null
  calculo?: PagoProveedorCalculoLinea | null
}

export interface PagoProveedorCotizacion {
  id: number
  codigo: string
  solicitud_id?: number | null
  estado: 'pendiente' | 'confirmada'
  cod_cotizacion_cc: string
  consolidado: string | null
  cliente_nombre: string | null
  cliente_documento: string | null
  cliente_whatsapp: string | null
  cliente_correo: string | null
  tipo_cambio: number | null
  tipo_cambio_confirmado: boolean
  vigencia_fin: string | null
  vigencia_texto: string
  vencida: boolean
  proveedores_cantidad: number
  total: number
  total_ahora: number
  comisiones: number
  puede_editar: boolean
  puede_eliminar: boolean
  puede_enviar: boolean
  puede_crear_solicitud: boolean
  puede_renovar: boolean
  faltantes_pdf: string[]
  faltantes: string[]
  codigos_disponibles: PagoProveedorCodigoCc[]
  proveedores: PagoProveedorProveedor[]
  creado_en: string | null
  historial: Array<{ accion: string; detalle: string | null; usuario: string; fecha: string | null }>
}

export interface PagoProveedorSolicitud {
  id: number
  numero_orden: number
  cotizacion_id: number
  cotizacion_codigo?: string | null
  cod_cotizacion_cc: string
  cliente_nombre: string | null
  cliente_documento?: string | null
  cliente_whatsapp?: string | null
  cliente_correo?: string | null
  consolidado: string | null
  tipo_cambio?: number | null
  proveedores_cantidad?: number
  total_cotizado?: number
  total_abonado?: number
  saldo_pendiente?: number
  excedente?: number
  creado_en: string | null
  proveedores?: PagoProveedorSolicitudProveedor[]
  abonos?: PagoProveedorAbono[]
}

export interface PagoProveedorSolicitudProveedor {
  id: number
  orden: number
  titulo: string
  code_supplier: string
  nombre_proveedor: string | null
  producto: string
  moneda: string
  tipo_pago: string
  valor_carga_usd: number
  bancaria_monto: number
  administrativa_monto: number
  total_monto: number
  etiqueta_bancaria: string | null
  importe_requerido: number
  importe_abonado: number
  saldo: number
  proforma_nombre: string | null
  proforma_url: string | null
  etapa: number
  etapa_nombre: string
  estado: string
  estado_nombre: string
  codigo_solicitud: string | null
  puede_editar_etapa1: boolean
  modalidad_abono: string
  datos: {
    estado: string
    origen: string | null
    vendedor_nombre: string | null
    wechat: string | null
    correccion_solicitada: boolean
    beneficiario_nombre: string | null
    banco_nombre: string | null
    banco_codigo: string | null
  }
}

export interface PagoProveedorAbono {
  id: number
  importe: number
  fecha_pago: string
  numero_operacion: string
  banco: string
  interbancaria: boolean
  voucher_nombre: string
  voucher_url: string | null
  estado: string
  estado_nombre: string
  excedente: number
  excedente_decision: string | null
  operacion_repetida: boolean
  puede_editar: boolean
  aplicaciones: Array<{ solicitud_proveedor_id: number; monto: number }>
}

export interface PagoProveedorPaginacion {
  current_page: number
  last_page: number
  per_page: number
  total: number
}
