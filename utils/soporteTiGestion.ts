import type { SoporteTiGestionEstado } from '~/types/soporteTi'

export type SoporteTiSelectItem = { label: string; value: string }

/** Opciones de USelect a partir de `gestion.estados` del API. */
export function estadosItems(estados: SoporteTiGestionEstado[]): SoporteTiSelectItem[] {
  return estados.map((e) => ({ label: e.nombre, value: e.codigo }))
}
