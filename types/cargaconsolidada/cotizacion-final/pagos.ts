import type { PaginationInfo } from "~/types/data-table"

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
    /** Estado de pago de cotización final (PENDIENTE, COTIZADO, COBRANDO, PAGADO, etc.) */
    estado_cotizacion_final?: string | null
    /** Diferencia entre total logística+impuestos y total pagado (desde backend) */
    diferencia?: number
}
export interface PagosResponse {
    data: Pagos[]
    pagination: PaginationInfo
    success: boolean
}   