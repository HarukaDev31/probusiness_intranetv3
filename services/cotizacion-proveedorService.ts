import { apiCall } from '~/utils/api'
import type { 
  ProveedoresResponse, 
  DocumentosChinaResponse, 
  InspeccionChinaResponse, 
  NotasChinaResponse,
  Filters,
  CotizacionProveedorResponse,
  Proveedor
} from '~/types/cargaconsolidada/proveedores'

export class CotizacionProveedorService {
  private static readonly baseUrl = 'api/carga-consolidada/cotizaciones-proveedores'

  /**
   * Obtiene las cotizaciones de proveedores con filtros y paginación
   */
  static async getCotizacionesProveedores(
    id: number, 
    filters: Filters, 
    search: string, 
    itemsPerPage: number, 
    currentPage: number
  ): Promise<ProveedoresResponse> {
    try {
      const response = await apiCall<ProveedoresResponse>(
        `${this.baseUrl}/contenedor/${id}`, 
        {
          method: 'GET',
          params: {
            ...filters,
            search,
            itemsPerPage,
            currentPage
          }
        }
      )
      return response
    } catch (error) {
      console.error('Error al obtener cotizaciones de proveedores:', error)
      throw new Error('No se pudieron obtener las cotizaciones de proveedores')
    }
  }

  /**
   * Obtiene los documentos de China para un proveedor específico
   */
  static async getDocumentosChina(id: number): Promise<DocumentosChinaResponse> {
    try {
      const response = await apiCall<DocumentosChinaResponse>(
        `${this.baseUrl}/proveedor/documentos/${id}`, 
        { method: 'GET' }
      )
      return response
    } catch (error) {
      console.error('Error al obtener los documentos de China:', error)
      throw new Error('No se pudieron obtener los documentos de China')
    }
  }

  /**
   * Obtiene la información de inspección de China para un proveedor
   */
  static async getInspeccionChina(id: number): Promise<InspeccionChinaResponse> {
    try {
      const response = await apiCall<InspeccionChinaResponse>(
        `${this.baseUrl}/proveedor/inspeccion/${id}`, 
        { method: 'GET' }
      )
      return response
    } catch (error) {
      console.error('Error al obtener la inspección de China:', error)
      throw new Error('No se pudo obtener la información de inspección de China')
    }
  }

  /**
   * Obtiene las notas de China para un proveedor
   */
  static async getNotasChina(id: number): Promise<NotasChinaResponse> {
    try {
      const response = await apiCall<NotasChinaResponse>(
        `${this.baseUrl}/proveedor/notas/${id}`, 
        { method: 'GET' }
      )
      return response
    } catch (error) {
      console.error('Error al obtener las notas de China:', error)
      throw new Error('No se pudieron obtener las notas de China')
    }
  }
  static async getProveedor(id: string): Promise<CotizacionProveedorResponse> {
    try {
      const response = await apiCall<CotizacionProveedorResponse>(
        `${this.baseUrl}/proveedor/${id}`, 
        { method: 'GET' }
      )
      return response
    } catch (error) {
      console.error('Error al obtener la cotización de proveedor:', error)
      throw new Error('No se pudo obtener la cotización de proveedor')
    }
  }
}