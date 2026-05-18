import type { SoporteTiGestionEstado, SoporteTiTipo } from '~/types/soporteTi'
import { estadosCatalogoPorTipo } from '~/constants/soporteTiColores'

export type SoporteTiSelectItem = {
  label: string
  value: string
  disabled?: boolean
}

/** @deprecated Usar `estadosItemsCompletos` para listar todo el catálogo con opciones deshabilitadas. */
export function estadosItems(estados: SoporteTiGestionEstado[]): SoporteTiSelectItem[] {
  return estados.map((e) => ({ label: e.nombre, value: e.codigo }))
}

/**
 * Todos los estados del tipo de solicitud; solo habilitados los que el API permite cambiar.
 */
export function estadosItemsCompletos(
  tipo: SoporteTiTipo,
  permitidos: SoporteTiGestionEstado[],
  opts?: { editable?: boolean }
): SoporteTiSelectItem[] {
  const editable = opts?.editable !== false
  const permitidosSet = new Set(permitidos.map((e) => e.codigo))
  return estadosCatalogoPorTipo(tipo).map((e) => ({
    label: e.nombre,
    value: e.codigo,
    disabled: !editable || !permitidosSet.has(e.codigo)
  }))
}
