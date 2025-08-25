export interface ClienteInfo {
  nombre: string
  dni: string
  whatsapp: string
  correo: string
  qtyProveedores: number
}

export interface ProductoItem {
  id: string
  nombre: string
  cbm: number
  peso: number
  precio: number
  qtyCaja: number
  cantidad: number
}

export interface Proveedor {
  id: string
  productos: ProductoItem[]
}

export interface CalculosFinales {
  totalCbm: number
  totalItems: number
  valorFOB: number
  flete: number
  seguro: number
  valorCFR: number
  valorCIF: number
  antidumping: number
  adValorem: number
  igv: number
  ipm: number
  percepcion: number
  total: number
}

export interface CalculadoraImportacionState {
  currentStep: number
  totalSteps: number
  clienteInfo: ClienteInfo
  proveedores: Proveedor[]
  calculosFinales: CalculosFinales
}
