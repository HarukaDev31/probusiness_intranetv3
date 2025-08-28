export interface ClienteInfo {
  nombre: string
  dni: string
  whatsapp: string
  correo: string
  qtyProveedores: number
  tipoCliente: string
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
  tarifa: Tarifa
}
