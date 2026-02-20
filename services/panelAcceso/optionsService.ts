import { BaseService } from '~/services/base/BaseService'

export interface EmpresaOption { id: number; nombre: string }
export interface OrgOption     { id: number; nombre: string }
export interface GrupoOption   { id: number; nombre: string; descripcion: string | null; privilegio: number }

export class OptionsService extends BaseService {

  static async getEmpresas(): Promise<EmpresaOption[]> {
    try {
      const res = await this.apiCall<{ success: boolean; data: EmpresaOption[] }>('/api/options/empresas')
      return res.data ?? []
    } catch { return [] }
  }

  static async getOrganizaciones(empresaId: number): Promise<OrgOption[]> {
    try {
      const res = await this.apiCall<{ success: boolean; data: OrgOption[] }>(
        `/api/options/organizaciones?empresa_id=${empresaId}`
      )
      return res.data ?? []
    } catch { return [] }
  }

  static async getGrupos(empresaId: number, orgId: number): Promise<GrupoOption[]> {
    try {
      const res = await this.apiCall<{ success: boolean; data: GrupoOption[] }>(
        `/api/options/grupos?empresa_id=${empresaId}&org_id=${orgId}`
      )
      return res.data ?? []
    } catch { return [] }
  }
}

export default OptionsService
