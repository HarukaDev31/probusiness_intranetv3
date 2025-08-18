import type { PaginationInfo } from "../types/data-table"


export interface Pagos {
    index: number
    nombre: string
    documento: string
    telefono: string
    tipo_cliente: string
    total_logistica_impuestos: number | null
    total_pagos: string
    pagos_count: number
    id_cotizacion: number
}
export interface PagosResponse {
    data: Pagos[]
    pagination: PaginationInfo
    success: boolean
}   