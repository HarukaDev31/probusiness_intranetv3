import type { CursoItem, PaginationInfo, HeadersInfo, CampanaFilter } from "~/types/cursos/cursos"
export interface CursoPagosFilters {
    estado_pago?: string
    campana?: number
    fecha_inicio?: string
    fecha_fin?: string
    search?: string
    Filtro_Fe_Inicio?: string
    Filtro_Fe_Fin?: string
    page?: number
    limit?: number
}

export interface CursoPagosResponse {
    success: boolean
    data: CursoItem[]
    pagination: PaginationInfo
    headers: HeadersInfo
    filters: {
        campanas: CampanaFilter[]
    }
}