import { BaseService } from "~/services/base/BaseService"

export interface AduanaData {
    naviera: string
    multa: number
    observaciones: string
    tipo_contenedor: string
    fecha_levante: string
    fecha_zarpe: string
    numero_dua: string
    fecha_arribo: string
    valor_fob: number
    fecha_declaracion: string
    valor_flete: number
    canal_control: string
    costo_destino: number
    ajuste_valor: number
    files: File[]
    impuestos_pagados: File[]
    idContainer: number
}

export interface AduanaResponse {
    success: boolean
    data?: any
    error?: string
}

export class AduanaService extends BaseService {
    private static baseUrl = 'api/carga-consolidada/contenedor/aduana'

    /**
     * Guarda los datos de aduana
     */
    static async saveAduana(data: AduanaData): Promise<AduanaResponse> {
        try {
            const formData = new FormData()

            // Agregar campos básicos
            formData.append('naviera', data.naviera)
            formData.append('multa', data.multa.toString())
            formData.append('observaciones', data.observaciones)
            formData.append('tipo_contenedor', data.tipo_contenedor)
            formData.append('fecha_levante', data.fecha_levante)
            formData.append('fecha_zarpe', data.fecha_zarpe)
            formData.append('numero_dua', data.numero_dua)
            formData.append('fecha_arribo', data.fecha_arribo)
            formData.append('valor_fob', data.valor_fob.toString())
            formData.append('fecha_declaracion', data.fecha_declaracion)
            formData.append('valor_flete', data.valor_flete.toString())
            formData.append('canal_control', data.canal_control)
            formData.append('costo_destino', data.costo_destino.toString())
            formData.append('ajuste_valor', data.ajuste_valor.toString())
            formData.append('idContainer', data.idContainer.toString())

            // Agregar archivos de tributos
            data.files.forEach((file, index) => {
                formData.append(`files[${index}]`, file)
            })

            // Agregar archivos de impuestos
            data.impuestos_pagados.forEach((file, index) => {
                formData.append(`impuestos_pagados[${index}]`, file)
            })

            const response = await this.apiCall<AduanaResponse>(`${this.baseUrl}`, {
                method: 'POST',
                body: formData
            })

            return response
        } catch (error: any) {
            console.error('Error al guardar datos de aduana:', error)
            return {
                success: false,
                error: error.message || 'Error al guardar los datos de aduana'
            }
        }
    }

    /**
     * Obtiene los datos de aduana por ID de contenedor
     */
    static async getAduanaByContainer(idContainer: number): Promise<AduanaResponse> {
        try {
            const response = await this.apiCall<AduanaResponse>(`${this.baseUrl}/${idContainer}`, {
                method: 'GET'
            })
            return response
        } catch (error: any) {
            console.error('Error al obtener datos de aduana:', error)
            return {
                success: false,
                error: error.message || 'Error al obtener los datos de aduana'
            }
        }
    }

    /**
     * Actualiza los datos de aduana
     */
    static async updateAduana(idContainer: number, data: AduanaData): Promise<AduanaResponse> {
        try {
            const formData = new FormData()

            // Agregar campos básicos
            formData.append('idContainer', data.idContainer.toString())
            formData.append('naviera', data.naviera)
            formData.append('multa', data.multa.toString())
            formData.append('observaciones', data.observaciones)
            formData.append('tipo_contenedor', data.tipo_contenedor)
            formData.append('fecha_levante', data.fecha_levante)
            formData.append('fecha_zarpe', data.fecha_zarpe)
            formData.append('numero_dua', data.numero_dua)
            formData.append('fecha_arribo', data.fecha_arribo)
            formData.append('valor_fob', data.valor_fob.toString())
            formData.append('fecha_declaracion', data.fecha_declaracion)
            formData.append('valor_flete', data.valor_flete.toString())
            formData.append('canal_control', data.canal_control)
            formData.append('costo_destino', data.costo_destino.toString())
            formData.append('ajuste_valor', data.ajuste_valor.toString())

            // Agregar archivos de tributos
            data.files.forEach((file, index) => {
                formData.append(`files[${index}]`, file)
            })

            // Agregar archivos de impuestos
            data.impuestos_pagados.forEach((file, index) => {
                formData.append(`impuestos_pagados[${index}]`, file)
            })

            const response = await this.apiCall<AduanaResponse>(`${this.baseUrl}`, {
                method: 'POST',
                body: formData
            })

            return response
        } catch (error: any) {
            console.error('Error al actualizar datos de aduana:', error)
            return {
                success: false,
                error: error.message || 'Error al actualizar los datos de aduana'
            }
        }
    }

    /**
     * Elimina un archivo específico
     */
    static async deleteFileAduana(fileId: string): Promise<AduanaResponse> {
        try {
            const response = await this.apiCall<AduanaResponse>(`${this.baseUrl}/files/${fileId}`, {
                method: 'DELETE'
            })
            return response
        } catch (error: any) {
            console.error('Error al eliminar el archivo de aduana:', error)
            return {
                success: false,
                error: error.message || 'Error al eliminar el archivo de aduana'
            }
        }
    }
}
