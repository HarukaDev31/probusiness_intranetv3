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
    servicios_extra_final?: number | null
    recargos_descuentos_final?: number | null
    impuestos_final: number
    tarifa_final: number | null
    estado_cotizacion_final: string
    id_cotizacion: number
}
export interface CobranzaWhatsappTemplate {
    key: string
    label: string
    description: string
    selected_by_default: boolean
    has_media: boolean
}

export interface GeneralResponse {
    success: boolean
    message?: string
    data?: General[] | Record<string, unknown>
    pagination?: PaginationInfo
    requires_whatsapp_selection?: boolean
    id_cotizacion?: number
    whatsapp_templates?: CobranzaWhatsappTemplate[]
}