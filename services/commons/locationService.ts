import { BaseService } from '~/services/base/BaseService'

export class LocationService extends BaseService {
  private static baseUrl = 'api/clientes/ubicacion'
  static async getPaises(): Promise<{ success: boolean; data: Array<{ id: number; nombre: string }> }> {
    return await this.apiCall(`${this.baseUrl}/paises`)
  }
  static async getDepartamentos(): Promise<{ success: boolean; data: Array<{ id: number; nombre: string }> }> {
    return await this.apiCall(`${this.baseUrl}/departamentos`)
  }

  static async getProvincias(idDepartamento: number): Promise<{ success: boolean; data: Array<{ id: number; nombre: string; id_provincia: number }> }> {
    return await this.apiCall(`${this.baseUrl}/provincias/${idDepartamento}`)
  }

  static async getDistritos(idProvincia: number): Promise<{ success: boolean; data: Array<{ id: number; nombre: string; id_provincia: number }> }> {
    return await this.apiCall(`${this.baseUrl}/distritos/${idProvincia}`)
  }
  static async getAllProvincias(): Promise<{ success: boolean; data: Array<{ value: number; label: string }> }> {
    return await this.apiCall(`${this.baseUrl}/provincias`)
  }
  static async getAllDistritos(): Promise<{ success: boolean; data: Array<{ id: number; nombre: string; id_provincia: number }> }> {
    return await this.apiCall(`${this.baseUrl}/distritos`)
  }
}
