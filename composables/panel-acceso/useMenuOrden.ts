import { MenuOrdenApiService } from '~/services/panelAcceso/menuOrdenService'
import type { MenuOrdenItem } from '~/types/panel-acceso/menuOrden'

/** Composable del mantenedor de orden de sidebar. Sin mapeos: el API ya trae la forma de UI. */
export function useMenuOrden() {
  return {
    opciones: (orgId?: number) => MenuOrdenApiService.opciones(orgId),
    loadPorGrupo: (grupoId: number, orgId?: number) => MenuOrdenApiService.porGrupo(grupoId, orgId),
    loadPorUsuario: (usuarioId: number) => MenuOrdenApiService.porUsuario(usuarioId),
    saveGrupo: (grupoId: number, items: MenuOrdenItem[], orgId?: number) =>
      MenuOrdenApiService.guardarGrupo(grupoId, items, orgId),
    saveUsuario: (usuarioId: number, items: MenuOrdenItem[]) =>
      MenuOrdenApiService.guardarUsuario(usuarioId, items),
    clearUsuario: (usuarioId: number) => MenuOrdenApiService.limpiarUsuario(usuarioId),
  }
}
