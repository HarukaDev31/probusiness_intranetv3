import type { PaginationInfo } from "~/services/clienteService"

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
    monto: string
    monto_final: string | null
    volumen: string
    volumen_final: string | null
}

export interface CotizacionFilters {
    fecha_inicio: string
    fecha_fin: string
    estado: string
    completado: boolean|false
}

export interface CotizacionResponse {
    data: Cotizacion[]
    pagination: PaginationInfo
}