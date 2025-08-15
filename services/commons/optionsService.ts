export class OptionsService {
    private static baseUrl = 'api/options'

    static async getPaises(): Promise<any> {
        try {
            const response = await apiCall<any>(`${this.baseUrl}/paises`, {
                method: 'GET'
            })
            return response
        }
        catch (error) {
            console.error('Error en OptionsService.getPaises:', error)
            throw error
        }
    }
}