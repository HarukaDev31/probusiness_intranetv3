import type { Header } from './data-table'

export interface Product {
  observaciones: string
  tiene_observaciones: boolean
  tipo_etiquetado_id: string
  entidad_id: string
  antidumping_value: string
  id: number
  idContenedor: number
  item: string
  nombre_comercial: string
  foto?: string | null
  caracteristicas: string
  rubro: string
  tipo_producto: string
  precio_exw: string
  subpartida: string
  link?: string
  unidad_comercial: string  
  anio: number
  arancel_sunat: string
  arancel_tlc?: string | null
  antidumping?: string | null
  correlativo?: string | null
  etiquetado?: string | null
  doc_especial?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  tipo: string
  carga_contenedor?: string
}

// Producto mapeado para el frontend
export interface ProductMapped {
  id: number
  nombreComercial: string
  codigo: string
  foto?: string
  caracteristicas: string
  descripcion: string
  rubro: string
  tipoProducto: string
  unidadComercial: string
  precioExw: number
  subpartida: string
  campana: string
  entidad_id: number
  tipo_etiquetado_id: number
  antidumping_value: string
  anio: number
  cargaContenedor?: string
  createdAt?: string
  updatedAt?: string
  observaciones: string
  tiene_observaciones: boolean
}

// Filtros para productos
export interface ProductFilters {
  rubro?: string
  tipoProducto?: string
  campana?: string
  precioMin?: number
  precioMax?: number
}

// Respuesta para un solo producto
export interface ProductResponse {
  success: boolean
  data: Product | null
  message?: string
  error?: string
}

// Estructura de paginación
export interface Pagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
  has_more_pages: boolean
  next_page_url: string | null
  prev_page_url: string | null
}

// Respuesta para múltiples productos con paginación
export interface ProductsResponse {
  data: Product[]
  pagination: Pagination
  headers: Header[]
}

// Respuesta del servicio con información de éxito/error
export interface ProductsServiceResponse {
  success: boolean
  data: Product[]
  pagination: Pagination | null
  error?: string
  headers: Header[]
}

// Respuesta para opciones de filtros
export interface FilterOptionsResponse {
  status: string
  data: {
    cargas: string[]
    rubros: string[]
    tipos_producto: string[]
  }
}

// Opciones para filtros (mapeadas para el frontend)
export interface FilterOptions {
  rubros: string[]
  tiposProducto: string[]
  campanas: string[]
}

// Parámetros para búsqueda y paginación
export interface ProductSearchParams {
  page?: number
  limit?: number
  search?: string
  filters?: ProductFilters
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Parámetros para exportación
export interface ExportParams {
  format: 'excel' | 'csv' | 'pdf'
  filters?: ProductFilters
  search?: string
} 