import type { Contenedor, ContenedorFilters, ContenedorPasosResponse, ContenedorResponse } from '~/types/cargaconsolidada/contenedor'
import { apiCall } from '~/utils/api'

export interface ConsolidadoParams {
    page?: number
    limit?: number
    search?: string
    fecha_inicio?: string
    fecha_fin?: string
    estado_china?: string
    completado?: boolean | false
}

export class ConsolidadoService {
    private static baseUrl = 'api/carga-consolidada/contenedor'

    static async getConsolidadoData(params: ConsolidadoParams = {}): Promise<ContenedorResponse> {
        try {
            // Validar y limpiar parámetros
            const cleanParams: any = {}

            if (params.page && params.page > 0) {
                cleanParams.page = params.page
            }

            if (params.limit && params.limit > 0) {
                cleanParams.limit = params.limit
            }

            if (params.search && params.search.trim()) {
                cleanParams.search = params.search.trim()
            }

            if (params.fecha_inicio) {
                cleanParams.fecha_inicio = params.fecha_inicio
            }

            if (params.fecha_fin) {
                cleanParams.fecha_fin = params.fecha_fin
            }

            if (params.estado_china && params.estado_china.trim() && params.estado_china !== 'todos') {
                cleanParams.estado_china = params.estado_china.trim()
            }

            if (params.completado) {
                cleanParams.completado = params.completado
            }

            const response = await apiCall<ContenedorResponse>(`${this.baseUrl}`, {
                method: 'GET',
                params: cleanParams
            })

            return response
        } catch (error) {
            console.error('Error en ConsolidadoService.getConsolidadoData:', error)
            throw error
        }
    }

    static async getConsolidadoById(id: number): Promise<Contenedor> {
        try {
            const response = await apiCall<{ success: boolean, data: Contenedor }>(`${this.baseUrl}/${id}`, {
                method: 'GET'
            })
            return response.data
        } catch (error) {
            console.error('Error en ConsolidadoService.getConsolidadoById:', error)
            throw error
        }
    }
    static async getConsolidadoPasos(id: number): Promise<ContenedorPasosResponse> {
        try {
            const response = await apiCall<ContenedorPasosResponse>(`${this.baseUrl}/pasos/${id}`, {
                method: 'GET'
            })
            return response
        } catch (error) {
            console.error('Error en ConsolidadoService.getConsolidadoPasos:', error)
            throw error
        }
    }
    static async getValidContainers(): Promise<any> {
        try {
            const response = await apiCall<any>(`${this.baseUrl}/valid-containers`, {
                method: 'GET'
            })
            return response
        } catch (error) {
            console.error('Error en ConsolidadoService.getValidContainers:', error)
            throw error
        }
    }
    static async createConsolidado(payload: any): Promise<any> {
        try {
            const response = await apiCall<any>(`${this.baseUrl}`, {
                method: 'POST',
                body: payload
            })
            return response
        } catch (error) {
            console.error('Error en ConsolidadoService.createConsolidado:', error)
            throw error
        }
    }
    static async deleteConsolidado(id: number): Promise<{ success: boolean }> {
        try {
            const response = await apiCall<{ success: boolean }>(`${this.baseUrl}/${id}`, {
                method: 'DELETE'
            })
            return response
        } catch (error) {
            console.error('Error en ConsolidadoService.deleteConsolidado:', error)
            throw error
        }
    }
}

export const consolidadoService = new ConsolidadoService()