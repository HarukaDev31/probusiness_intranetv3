export interface ClienteInfo {
  nombre: string
  dni: string
  whatsapp: string | null
  correo: string
  qtyProveedores: number
  tipoCliente: string
  tipoDocumento?: string
  empresa?: string
  ruc?: string
}

export interface ProductoItem {
  id: string
  nombre: string
  precio: number
  cantidad: number
  antidumpingCU: number
  antidumping: number
  adValorem: number
  adValoremP: number
  igv: number
  ipm: number
  percepcion: number
  total: number
  costoDestino: number
  costoTotal: number
  costoUnitarioUSD: number
  costoUnitarioPEN: number
  valoracion: number
  showValoracion: boolean
  extraItem: number
}

export interface Proveedor {
  id: string
  cbm: number
  peso: number
  qtyCaja: number
  productos: ProductoItem[]
  extraProveedor: number
  collapsed?: boolean
}


export interface Tarifa {
  id: number
  limit_inf: string
  limit_sup: string
  type: 'STANDARD' | 'PLAIN'
  tarifa: number
  label: string
  value: string
}
export interface ProveedorRequest {
  cbm: number
  peso: number
  qtyCaja: number
  productos: ProductoItemRequest[]
}
export interface ProductoItemRequest {
  nombre: string
  precio: number
  valoracion: number
  cantidad: number
  antidumpingCU: number
  adValoremP: number
 
}
export interface saveCotizacionRequest {
  clienteInfo: ClienteInfo
  proveedores: ProveedorRequest[]
  tarifaTotalExtraProveedor: number
  tarifaTotalExtraItem: number
  tarifaDescuento: number
  id_usuario: number | null
  id_carga_consolidada_contenedor: number | null
  tarifa: Tarifa
  tipo_cambio: number
}

export interface CotizacionFilters {
  fecha_inicio: string
  fecha_fin: string
  estado: string
  completado: boolean
  campania: string
  estado_calculadora: string
}

export interface FilterOption {
  id?: number
  label: string
  value: string | number
}

export interface FilterOptions {
  contenedores: FilterOption[]
  estadoCalculadora: FilterOption[]
}
