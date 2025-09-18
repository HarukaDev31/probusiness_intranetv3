import { BaseService } from "../base/BaseService"
import type { 
    DashboardResumenResponse, 
    DashboardVendedorResponse, 
    DashboardFiltroContenedorResponse, 
    DashboardFiltroVendedorResponse,
    DashboardEvolucionResponse,
    DashboardCotizacionesDiariasResponse,
    DashboardFilters 
} from "~/types/dashboard"

export class DashboardService extends BaseService {
    private static baseUrl = 'api/carga-consolidada/dashboard-ventas'

    /**
     * Obtener resumen de ventas por contenedor
     */
    static async getResumen(filters: DashboardFilters = {}): Promise<DashboardResumenResponse> {
        try {
            const response = await this.apiCall<DashboardResumenResponse>(`${this.baseUrl}/resumen`, {
                method: 'GET',
                params: filters
            })
            return response
        } catch (error) {
            console.error('Error al obtener resumen de ventas:', error)
            throw error
        }
    }

    /**
     * Obtener estadísticas por vendedor
     */
    static async getPorVendedor(filters: DashboardFilters = {}): Promise<DashboardVendedorResponse> {
        try {
            const response = await this.apiCall<DashboardVendedorResponse>(`${this.baseUrl}/por-vendedor`, {
                method: 'GET',
                params: filters
            })
            return response
        } catch (error) {
            console.error('Error al obtener datos por vendedor:', error)
            throw error
        }
    }

    /**
     * Obtener filtros de contenedores
     */
    static async getFiltrosContenedores(filters: DashboardFilters = {}): Promise<DashboardFiltroContenedorResponse> {
        try {
            const response = await this.apiCall<DashboardFiltroContenedorResponse>(`${this.baseUrl}/filtros/contenedores`, {
                method: 'GET',
                params: filters
            })
            return response
        } catch (error) {
            console.error('Error al obtener filtros de contenedores:', error)
            throw error
        }
    }

    /**
     * Obtener filtros de vendedores
     */
    static async getFiltrosVendedores(filters: DashboardFilters = {}): Promise<DashboardFiltroVendedorResponse> {
        try {
            const response = await this.apiCall<DashboardFiltroVendedorResponse>(`${this.baseUrl}/filtros/vendedores`, {
                method: 'GET',
                params: filters
            })
            return response
        } catch (error) {
            console.error('Error al obtener filtros de vendedores:', error)
            throw error
        }
    }

    /**
     * Obtener evolución total de volúmenes
     */
    static async getEvolucionTotal(filters: DashboardFilters = {}): Promise<DashboardEvolucionResponse> {
        try {
            const response = await this.apiCall<DashboardEvolucionResponse>(`${this.baseUrl}/evolucion-total`, {
                method: 'GET',
                params: filters
            })
            return response
        } catch (error) {
            console.error('Error al obtener evolución de volúmenes:', error)
            throw error
        }
    }

    /**
     * Obtener cotizaciones confirmadas por vendedor por día
     */
    static async getCotizacionesConfirmadasPorVendedorPorDia(filters: DashboardFilters = {}): Promise<DashboardCotizacionesDiariasResponse> {
        try {
            const response = await this.apiCall<DashboardCotizacionesDiariasResponse>(`${this.baseUrl}/cotizaciones-confirmadas-por-vendedor-por-dia`, {
                method: 'GET',
                params: filters
            })
            return response
        } catch (error) {
            console.error('Error al obtener cotizaciones confirmadas por vendedor por día:', error)
            throw error
        }
    }
}