import { BaseService } from '~/services/base/BaseService'

const BASE_URL = 'api/carga-consolidada/contenedor/factura-guia/contabilidad'

export class ContabilidadService extends BaseService {
    static async uploadComprobante(data: FormData): Promise<{ success: boolean; message: string; data: any; extracted?: boolean }> {
        return this.apiCall(`${BASE_URL}/upload-comprobante`, { method: 'POST', body: data })
    }

    static async uploadConstancia(comprobanteId: number, file: File): Promise<{ success: boolean; message: string; data: any; extracted: boolean }> {
        const formData = new FormData()
        formData.append('file', file)
        return this.apiCall(`${BASE_URL}/upload-constancia/${comprobanteId}`, { method: 'POST', body: formData })
    }

    static async uploadComprobantesBatch(idCotizacion: number, files: File[]): Promise<{
        success: boolean
        message: string
        created: Array<{ data: any; extracted: boolean }>
        errors: Array<{ index: number; file_name?: string | null; message: string }>
    }> {
        const formData = new FormData()
        formData.append('idCotizacion', String(idCotizacion))
        files.forEach((f) => formData.append('files[]', f))
        return this.apiCall(`${BASE_URL}/upload-comprobantes-batch`, { method: 'POST', body: formData })
    }

    static async uploadConstanciasBatch(items: Array<{ comprobanteId: number; file: File }>): Promise<{
        success: boolean
        message: string
        created: Array<{ comprobante_id: number; data: any; extracted: boolean }>
        errors: Array<{ index: number; comprobante_id: number; message: string }>
    }> {
        const formData = new FormData()
        items.forEach((it) => {
            formData.append('comprobante_ids[]', String(it.comprobanteId))
            formData.append('files[]', it.file)
        })
        return this.apiCall(`${BASE_URL}/upload-constancias-batch`, { method: 'POST', body: formData })
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
            cotizacion_inicial_url?: string | null
            cotizacion_final_url?: string | null
            contrato_url?: string | null
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

    static async getComprobanteForm(idCotizacion: number): Promise<{ success: boolean; data: any }> {
        return this.apiCall(`${BASE_URL}/comprobante-form/${idCotizacion}`)
    }

    static async updateComprobanteForm(idCotizacion: number, data: {
        tipo_comprobante: string
        destino_entrega?: string | null
        razon_social?: string | null
        ruc?: string | null
        nombre_completo?: string | null
        dni_carnet?: string | null
    }): Promise<{ success: boolean; message: string; data?: any }> {
        return this.apiCall(`${BASE_URL}/comprobante-form/${idCotizacion}`, {
            method: 'PUT',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        })
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
