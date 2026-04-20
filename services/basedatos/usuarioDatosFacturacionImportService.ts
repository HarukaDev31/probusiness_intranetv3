import { BaseService } from '~/services/base/BaseService'

export interface UsuarioDatosFacturacionImportItem {
  id: number
  nombre_archivo: string
  cantidad_rows: number
  estado: string
  rollback_at: string | null
  created_at: string
  estadisticas: {
    total_filas?: number
    creados?: number
    omitidos?: number
    sin_usuario?: number
    errores?: number
    detalles?: string[]
  } | null
  ruta_archivo: string | null
}

export class UsuarioDatosFacturacionImportService extends BaseService {
  private static baseUrl = '/api/base-datos/clientes/facturacion'

  static async importExcel(file: File): Promise<{ success: boolean; message: string; data?: any }> {
    const formData = new FormData()
    formData.append('excel_file', file)

    return await this.apiCall<{ success: boolean; message: string; data?: any }>(`${this.baseUrl}/import-excel`, {
      method: 'POST',
      body: formData
    })
  }

  static async getImports(): Promise<{ success: boolean; data: UsuarioDatosFacturacionImportItem[] }> {
    return await this.apiCall<{ success: boolean; data: UsuarioDatosFacturacionImportItem[] }>(`${this.baseUrl}/imports`, {
      method: 'GET'
    })
  }

  static async rollbackImport(idImport: number): Promise<{ success: boolean; message: string; data?: any }> {
    return await this.apiCall<{ success: boolean; message: string; data?: any }>(`${this.baseUrl}/imports/${idImport}/rollback`, {
      method: 'POST'
    })
  }
}
