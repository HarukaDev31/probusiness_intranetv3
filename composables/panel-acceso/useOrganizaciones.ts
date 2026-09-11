import { OrganizacionService } from '~/services/panelAcceso/organizacionService'
import { OptionsService } from '~/services/panelAcceso/optionsService'
import type {
  CreateOrganizacionRequest,
  Organizacion,
  UpdateOrganizacionRequest,
} from '~/services/panelAcceso/organizacionService'

export type PortalPayload = Pick<
  UpdateOrganizacionRequest,
  | 'url_clientes'
  | 'url_excel_confirmacion'
  | 'url_datos_proveedor'
  | 'nombre_publico'
  | 'drive_folder_id'
  | 'logo_url'
  | 'regenerar_public_key'
>

export function useOrganizaciones() {
  async function listar(params: { empresa_id?: number } = {}) {
    return await OrganizacionService.getOrganizaciones(params)
  }

  async function listarEmpresas() {
    const empresas = await OptionsService.getEmpresas()
    return empresas.map(e => ({ label: e.nombre, value: e.id }))
  }

  async function listarPaises() {
    const res = await OrganizacionService.getPaises()
    return res.data ?? []
  }

  async function crear(data: CreateOrganizacionRequest) {
    return await OrganizacionService.createOrganizacion(data)
  }

  async function actualizar(id: number, data: UpdateOrganizacionRequest) {
    return await OrganizacionService.updateOrganizacion(id, data)
  }

  async function guardarPortal(org: Organizacion, data: PortalPayload) {
    return await OrganizacionService.updateOrganizacion(org.id, {
      id_empresa: org.id_empresa,
      no_organizacion: org.no_organizacion,
      txt_organizacion: org.txt_organizacion ?? undefined,
      estado: org.estado,
      url_clientes: data.url_clientes || '',
      url_excel_confirmacion: data.url_excel_confirmacion || '',
      url_datos_proveedor: data.url_datos_proveedor || '',
      nombre_publico: data.nombre_publico || '',
      drive_folder_id: data.drive_folder_id || '',
      logo_url: data.logo_url || '',
      regenerar_public_key: data.regenerar_public_key,
    })
  }

  async function desactivar(id: number) {
    return await OrganizacionService.deleteOrganizacion(id)
  }

  return { listar, listarEmpresas, listarPaises, crear, actualizar, guardarPortal, desactivar }
}
