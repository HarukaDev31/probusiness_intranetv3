import type { PaginationInfo } from "~/types/data-table"


export interface General {
    nombre: number
    documento: string
    correo: string | null
    telefono: string
    tipo_cliente: number
    volumen_final: number | null
    fob_final: number
    logistica_final: number | null
    impuestos_final: number
    tarifa_final: number | null
    estado_cotizacion_final: string
    id_cotizacion: number
}
export interface GeneralResponse {
    success: boolean
    data: General[]
    pagination: PaginationInfo
}