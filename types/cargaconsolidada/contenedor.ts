import type { Pais } from '~/types/commons/location'
import type { PaginationInfo } from '~/types/data-table'
export interface Contenedor {
    id: number
    mes: string
    id_pais: number
    carga: string
    f_puerto: string
    f_entrega: string
    empresa: string
    estado: string
    f_cierre: string
    lista_embarque_url: string
    bl_file_url: string
    factura_general_url: string
    estado_china: string
    estado_documentacion: string
    tipo_carga: string  
    naviera: string
    tipo_contenedor: string
    canal_control: string
    numero_dua: string
    fecha_zarpe: string
    fecha_arribo: string
    fecha_declaracion: string
    fecha_levante: string
    valor_fob: string
    valor_flete: string
    costo_destino: string
    ajuste_valor: string
    multa: string
    observaciones: string
    pais: Pais
}
export interface ContenedorResponse {
    success: boolean
    data: Contenedor[],
    pagination: PaginationInfo
}
export interface ContenedorFilters {
   fecha_inicio?: string
   fecha_fin?: string
   estado_china?: string
   search?: string
}