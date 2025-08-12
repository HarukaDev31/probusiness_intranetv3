import type { FileItem } from "../commons/file"
import type { PaginationInfo, FilterConfig } from "../data-table"

export interface Proveedor {
    id: number
    peso: number
    estados: string
    qty_box: number
    products: string
    supplier: string
    cbm_total: number
    estado_china: string
    id_proveedor: number
    code_supplier: string
    qty_box_china: number
    supplier_phone: string
    cbm_total_china: number
    arrive_date_china: string
    totales?: ProveedorTotales[]
}

export interface CotizacionProveedor {
    id: number
    id_contenedor: number
    id_usuario: number
    id_tipo_cliente: number
    nombre: string
    telefono: string
    estado_cotizador: string
    fecha_confirmacion: string
    No_Nombres_Apellidos: string
    proveedores: Proveedor[]
}

export interface ProveedoresResponse {
    success: boolean
    data: CotizacionProveedor[]
    filters: FilterConfig[]
    pagination: PaginationInfo
}

export interface ProveedorTotales {
    key: string
    value: number
}

/**
 * Respuesta para obtener notas de China
 */
export interface NotasChinaResponse {
    success: boolean
    data: {
        nota: string
    }
}

/**
 * Respuesta para obtener inspección de China
 */
export interface InspeccionChinaResponse {
    success: boolean
    data: FileItem[]
}

/**
 * Respuesta para obtener documentos de China
 */
export interface DocumentosChinaResponse {
    success: boolean
    data: FileItem[]
}

export interface Filters {
    estado_china: string
}
export interface CotizacionProveedorResponse {
    success: boolean
    data: Proveedor
}
// Mantener compatibilidad con nombres anteriores
export type getNotasChinaResponse = NotasChinaResponse
export type getInspeccionChinaResponse = InspeccionChinaResponse
export type getDocumentosChinaResponse = DocumentosChinaResponse