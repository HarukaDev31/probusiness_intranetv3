import type { PaginationInfo } from '~/types/data-table'

/** Un comprobante en la lista de factura-guía (contabilidad) */
export interface ComprobanteListItem {
    id: number
    tipo_comprobante: string | null
    valor_comprobante: number | null
    tiene_detraccion: boolean
    detraccion: { monto: number; file_url?: string } | null
    comprobante_file_url: string | null
    file_name: string | null
}

export interface GeneralResponse {
    data: General[]
    pagination: PaginationInfo
    success: boolean
}

export interface General {
    id: number
    id_cliente: number
    id_contenedor: number
    id_tipo_cliente: number
    fecha: string
    nombre: string
    documento: string
    correo: string
    telefono: string
    volumen: string
    cotizacion_file_url: string
    cotizacion_final_file_url: string
    estado: string
    volumen_doc: string
    valor_doc: string
    valor_cot: string
    volumen_china: string
    factura_comercial: string
    id_usuario: number
    monto: string
    fob: string
    impuestos: string
    tarifa: string
    excel_comercial: string
    excel_confirmacion: string
    vol_selected: string
    estado_cliente: string
    peso: string
    tarifa_final: string
    monto_final: string
    volumen_final: string
    guia_remision_url: string
    factura_general_url: string
    cotizacion_final_url: string
    estado_cotizador: string
    fecha_confirmacion: string
    estado_pagos_coordinacion: string
    estado_cotizacion_final: string
    impuestos_final: string
    fob_final: string
    note_administracion: string
    id_cliente_importacion: string
    status_cliente_doc: string
    logistica_final: string
    qty_item: number
    updated_at: string
    name: string
    id_cotizacion: number
    /** Relación de comprobantes subidos (tipo, valor, detracción, archivo) */
    comprobantes?: ComprobanteListItem[]
    total_comprobantes?: number
    total_detracciones?: number
    tipo_comprobante?: string | null
    comprobante_file_url?: string | null
    detraccion_file_url?: string | null
    registrado?: boolean
}