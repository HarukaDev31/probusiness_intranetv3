import type { Header, PaginationInfo } from '~/types/data-table'

export interface CustomersFilters {
  id_pais?: string
  estado_china?: string
}

export interface CustomerProveedor {
  id: number
  id_proveedor: number
  products?: string
  supplier?: string
  code_supplier?: string
  supplier_phone?: string
  qty_box?: number | string
  qty_box_china?: number | string
  qty_pallet_china?: number | string
  cbm_total?: number | string
  cbm_total_china?: number | string
  peso?: number | string
  peso_china?: number | string
  estados_proveedor?: string
  estados?: string
  arrive_date_china?: string
  arrive_date?: string
}

export interface CustomerRow {
  id: number
  uuid?: string
  nombre?: string
  telefono?: string
  id_contenedor: number
  estado_cotizador?: string
  carga?: string | number
  anio?: string
  carga_label?: string
  pais?: string
  id_pais?: number
  contenedor_estado_china?: string
  contenedor_cerrado?: boolean
  proveedores: CustomerProveedor[]
}

export interface CustomersPaisOption {
  id: number
  nombre: string
}

export interface CustomersResponse {
  success: boolean
  data: CustomerRow[]
  pagination: PaginationInfo
  headers: Record<string, Header>
  paises: CustomersPaisOption[]
}
