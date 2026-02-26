import { BaseService } from '~/services/base/BaseService'

const BASE_URL = 'api/carga-consolidada/contenedor/factura-guia/contabilidad'

export class ContabilidadService extends BaseService {
    static async uploadComprobante(data: FormData): Promise<{ success: boolean; message: string; data: any }> {
        return this.apiCall(`${BASE_URL}/upload-comprobante`, { method: 'POST', body: data })
    }

    static async uploadConstancia(comprobanteId: number, file: File): Promise<{ success: boolean; message: string; data: any; extracted: boolean }> {
        const formData = new FormData()
        formData.append('file', file)
        return this.apiCall(`${BASE_URL}/upload-constancia/${comprobanteId}`, { method: 'POST', body: formData })
    }

    static async deleteComprobante(id: number): Promise<{ success: boolean; message: string }> {
        return this.apiCall(`${BASE_URL}/delete-comprobante/${id}`, { method: 'DELETE' })
    }

    static async deleteConstancia(id: number): Promise<{ success: boolean; message: string }> {
        return this.apiCall(`${BASE_URL}/delete-constancia/${id}`, { method: 'DELETE' })
    }

    static async getDetalle(idCotizacion: number): Promise<{
        success: boolean
        cliente: any
        comprobantes: any[]
        total_comprobantes: number
        total_detracciones: number
        panel: {
            tiene_cotizacion_inicial: boolean
            tiene_cotizacion_final: boolean
            tiene_contrato: boolean
            guia_remision_url: string | null
            guia_remision_file_name: string | null
            nota_contabilidad: string | null
        }
    }> {
        return this.apiCall(`${BASE_URL}/detalle/${idCotizacion}`)
    }

    static async saveNota(idCotizacion: number, nota: string): Promise<{ success: boolean; message: string }> {
        return this.apiCall(`${BASE_URL}/nota/${idCotizacion}`, {
            method: 'PUT',
            body: JSON.stringify({ nota }),
            headers: { 'Content-Type': 'application/json' }
        })
    }

    static async getClientesContenedor(idContenedor: number): Promise<{ success: boolean; data: any[] }> {
        return this.apiCall(`${BASE_URL}/clientes/${idContenedor}`)
    }

    static async enviarFormulario(idContenedor: number, cotizacionIds: number[]): Promise<{
        success: boolean
        enviados: any[]
        errores: any[]
        message: string
    }> {
        return this.apiCall(`${BASE_URL}/enviar-formulario/${idContenedor}`, {
            method: 'POST',
            body: JSON.stringify({ cotizacion_ids: cotizacionIds }),
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
