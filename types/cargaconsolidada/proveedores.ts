import type { FileItem } from "../commons/file"
import type { PaginationInfo,FilterConfig } from "../data-table"

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
    totales: ProveedorTotales[]
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
}

export interface ProveedorTotales{
    key: string
    value: number
}


/**
 * {"success":true,"data":{"nota":""}}
 */
export interface getNotasChinaResponse {
    success: boolean
    data: {
        nota: string
    }
}

export interface getInspeccionChinaResponse {
    success: boolean
    data: FileItem[]
}
export interface getDocumentosChinaResponse {
    success: boolean
    data: FileItem[]
}