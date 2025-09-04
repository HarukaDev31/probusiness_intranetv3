export interface VariacionCliente {
  id: string
  id_cliente: string
  id_contenedor: string
  id_tipo_cliente: string
  fecha: string
  nombre: string
  documento: string
  correo: string
  telefono: string
  estado: string
  estado_cliente: string
  estado_cotizador: string
  estado_pagos_coordinacion: string
  estado_cotizacion_final: string
  fecha_confirmacion: string | null
  monto: string
  monto_final: string | null
  volumen: string
  volumen_final: string | null
  fob: string
  fob_final: string
  impuestos: string
  impuestos_final: string
  tarifa: string
  tarifa_final: string | null
  valor_cot: string
  valor_doc: string
  volumen_doc: string | null
  peso: string
  qty_item: string
  vol_selected: string | null
  volumen_china: string | null
  id_cliente_importacion: string | null
  note_administracion: string | null
  status_cliente_doc: string
  logistica_final: string | null
  updated_at: string
  id_usuario: string
  
  // URLs de archivos
  cotizacion_file_url: string | null
  cotizacion_final_file_url: string | null
  cotizacion_final_url: string | null
  guia_remision_url: string | null
  factura_general_url: string | null
  
  // Archivos por tipo
  excel_comercial: string | null
  excel_confirmacion: string | null
  factura_comercial: string | null
  
  // Arrays de archivos (pueden venir como string JSON o array)
  files: string | null
  files_almacen_documentacion: string | null
  files_almacen_inspection: string | null
  
  // Proveedores (pueden venir como string JSON o array)
  providers: string | null
}

export interface ProveedorVariacion {
  id: number
  valor_doc: number
  volumen_doc: number
  packing_list: string | null
  code_supplier: string
  files: string | null
  factura_comercial: string | null
  excel_confirmacion: string | null
  files_almacen_documentacion: string | null
  files_almacen_inspection: string | null
}

export interface ArchivoVariacion {
  id: number
  file_ext: string
  file_url: string
  file_name: string
  folder_name?: string
  id_proveedor: number
}

export interface VariacionClienteResponse {
  success: boolean
  data: VariacionCliente
}

export interface VariacionClienteUpdateRequest {
  volumen_doc?: number
  valor_doc?: number
  estado?: string
  estado_cliente?: string
  estado_cotizador?: string
  monto?: number
  tarifa?: number
  impuestos?: number
  fob?: number
  peso?: number
  qty_item?: number
  volumen?: number
  providers?: string
}

export interface ProveedorUpdateRequest {
  valor_doc?: number
  volumen_doc?: number
  packing_list?: string | null
  factura_comercial?: string | null
  excel_confirmacion?: string | null
}
