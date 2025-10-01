import { BaseService } from '~/services/base/BaseService'

export class LocationService extends BaseService {
  private static baseUrl = 'api/clientes/ubicacion'

  static async getDepartamentos(): Promise<{ success: boolean; data: Array<{ id: number; nombre: string }> }> {
    return await this.apiCall(`${this.baseUrl}/departamentos`)
  }

  static async getProvincias(idDepartamento: number): Promise<{ success: boolean; data: Array<{ id: number; nombre: string; id_departamento: number }> }> {
    return await this.apiCall(`${this.baseUrl}/provincias/${idDepartamento}`)
  }

  static async getDistritos(idProvincia: number): Promise<{ success: boolean; data: Array<{ id: number; nombre: string; id_provincia: number }> }> {
    return await this.apiCall(`${this.baseUrl}/distritos/${idProvincia}`)
  }
}
