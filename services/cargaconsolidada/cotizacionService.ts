export class CotizacionService {
    private static baseUrl = 'api/carga-consolidada/contenedor'
    static async getCotizaciones(id: number, filters: any) {
        try {
            console.log("xd2")
            const response = await apiCall<any>(`${this.baseUrl}/cotizaciones/${id}`, {
                method: 'GET',
                params: filters
            })
            return response
        } catch (error) {
            console.error('Error al obtener las cotizaciones:', error)
            throw error
        }
    }
    static async refreshCotizacionFile(id: number) {
        try {
            const response = await apiCall<any>(`${this.baseUrl}/cotizaciones/${id}/refresh`, {
                method: 'POST'
            })
            return response
        } catch (error) {
            console.error('Error al actualizar la cotización:', error)
            throw error
        }
    }
}   