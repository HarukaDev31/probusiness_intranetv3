import type { PaginationInfo } from "../data-table"
import type { HeaderResponse } from '../data-table'
import type { SeguimientoDriveHeadersPayload } from './seguimiento-drive'

export type CotizacionesHeadersResponse = HeaderResponse & SeguimientoDriveHeadersPayload

export interface Cotizacion {
    id: number
    nombre: string
    documento: string
    telefono: string
    correo: string
    fecha: string
    estado: string
    estado_cliente: string
    estado_cotizador: string
    tipo_cliente?: string | null
    origen_marketing?: string | null
    monto: string
    monto_final: string | null
    volumen: string
    volumen_neto?: string | null
    volumen_final: string | null
}

export interface CotizacionFilters {
    fecha_inicio: string
    fecha_fin: string
    estado: string
    estado_coordinacion: string
    estado_cotizador: string
    estado_china: string
}

export interface CotizacionResponse {
    data: Cotizacion[]
    pagination: PaginationInfo
}