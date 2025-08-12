import { apiCall } from '~/utils/api'
import type { ProveedoresResponse, getDocumentosChinaResponse } from '~/types/cargaconsolidada/proveedores'
import type { getInspeccionChinaResponse } from '~/types/cargaconsolidada/proveedores'
import type { getNotasChinaResponse } from '~/types/cargaconsolidada/proveedores'
export class CotizacionProveedorService {
    private static baseUrl = 'api/carga-consolidada/cotizaciones-proveedores'
    static async getCotizacionesProveedores(id: number): Promise<ProveedoresResponse> {
        const response = await apiCall<ProveedoresResponse>(`${this.baseUrl}/contenedor/${id}`, {
            method: 'GET'
        })
        return response
    }
    static async getDocumentosChina(id: number): Promise<getDocumentosChinaResponse> {
        try {
            const response = await apiCall<getDocumentosChinaResponse>(`${this.baseUrl}/proveedor/documentos/${id}`, {
                method: 'GET'
            })
            return response
        } catch (error) {
            console.error('Error al obtener los documentos:', error)
            throw new Error('No se pudieron obtener los documentos')
        }
    }
    static async getInspeccionChina(id: number): Promise<getInspeccionChinaResponse> {
        try {
            const response = await apiCall<getInspeccionChinaResponse>(`${this.baseUrl}/proveedor/inspeccion/${id}`, {
                method: 'GET'
            })
            return response
        } catch (error) {
            console.error('Error al obtener la inspección:', error)
            throw new Error('No se pudo obtener la inspección')
        }
    }
    static async getNotasChina(id: number): Promise<getNotasChinaResponse> {
        try {
            const response = await apiCall<getNotasChinaResponse>(`${this.baseUrl}/proveedor/notas/${id}`, {
                method: 'GET'
            })
            return response
        } catch (error) {
            console.error('Error al obtener las notas:', error)
            throw new Error('No se pudieron obtener las notas')
        }
    }
}