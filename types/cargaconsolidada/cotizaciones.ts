import type { PaginationInfo } from "~/services/clienteService"

export interface Cotizacion {
    id: number
    fecha: string
    estado: string
    cliente: string
    proveedor: string
}

export interface CotizacionFilters {
    fecha_inicio: string
    fecha_fin: string
    estado_china: string
    completado: boolean|false
}

export interface CotizacionResponse {
    data: Cotizacion[]
    pagination: PaginationInfo
}