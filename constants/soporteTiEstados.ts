import type { SoporteTiTipo } from '~/types/soporteTi'

/** API codes (snake). Compare with `CODE.*`, never raw strings. */
export const CODE = {
  PENDING: 'pendiente',
  MOCKUP: 'en_maqueta',
  IN_PROGRESS: 'en_progreso',
  DONE: 'hecho',
  DEPLOYED: 'desplegado',
  OBSERVED: 'observado',
  OPERATIVE: 'operativo'
} as const

export type SoporteTiEstadoCodigo = (typeof CODE)[keyof typeof CODE]

/** Stats / kanban: treated as “in progress” bucket. */
export const IN_PROGRESS_CODES: readonly SoporteTiEstadoCodigo[] = [
  CODE.IN_PROGRESS,
  CODE.MOCKUP,
  CODE.DONE
]

export interface SoporteTiEstadoDef {
  id: number
  codigo: SoporteTiEstadoCodigo
  nombre: string
  /** null = applies to tipo A and B */
  tipoSolicitud: SoporteTiTipo | null
  ordenKanban: number | null
  colorBadge?: string
}

/** Catalog aligned with `soporte_ti_estados` in Laravel. */
export const SOPORTE_TI_ESTADOS: SoporteTiEstadoDef[] = [
  { id: 1, codigo: CODE.PENDING, nombre: 'Pendiente', tipoSolicitud: null, ordenKanban: 1 },
  { id: 2, codigo: CODE.MOCKUP, nombre: 'En maqueta', tipoSolicitud: 'A', ordenKanban: 2 },
  { id: 3, codigo: CODE.IN_PROGRESS, nombre: 'En progreso', tipoSolicitud: null, ordenKanban: 3 },
  { id: 4, codigo: CODE.DONE, nombre: 'Hecho', tipoSolicitud: 'B', ordenKanban: 4 },
  { id: 5, codigo: CODE.DEPLOYED, nombre: 'Desplegado', tipoSolicitud: null, ordenKanban: 5 },
  { id: 6, codigo: CODE.OBSERVED, nombre: 'Observado', tipoSolicitud: null, ordenKanban: 6 },
  { id: 7, codigo: CODE.OPERATIVE, nombre: 'Operativo', tipoSolicitud: null, ordenKanban: 7 }
]

export const BY_ID = Object.fromEntries(
  SOPORTE_TI_ESTADOS.map((e) => [e.id, e])
) as Record<number, SoporteTiEstadoDef>

export const BY_CODE = Object.fromEntries(
  SOPORTE_TI_ESTADOS.map((e) => [e.codigo, e])
) as Record<string, SoporteTiEstadoDef>

export const BY_NAME = Object.fromEntries(
  SOPORTE_TI_ESTADOS.map((e) => [e.nombre, e])
) as Record<string, SoporteTiEstadoDef>

/** Kanban columns for DataTable: `key` === `estadoCodigo`. */
export const SOPORTE_TI_KANBAN_BOARD = SOPORTE_TI_ESTADOS.filter((e) => e.ordenKanban != null)
  .sort((a, b) => (a.ordenKanban ?? 0) - (b.ordenKanban ?? 0))
  .map((e) => ({ key: e.codigo, label: e.nombre }))

export const SOPORTE_TI_KANBAN_COLUMNAS = SOPORTE_TI_ESTADOS.filter((e) => e.ordenKanban != null)
  .sort((a, b) => (a.ordenKanban ?? 0) - (b.ordenKanban ?? 0))
  .map((e) => e.nombre)

export function byId(id: number): SoporteTiEstadoDef | undefined {
  return BY_ID[id]
}

export function byCode(codigo: string): SoporteTiEstadoDef | undefined {
  return BY_CODE[codigo]
}

export function byName(nombre: string): SoporteTiEstadoDef | undefined {
  return BY_NAME[nombre]
}

/** Resolve id / code / legacy name → definition. */
export function resolve(
  ref: { estadoId?: number; estadoCodigo?: string; estado?: string } | string
): SoporteTiEstadoDef {
  if (typeof ref === 'string') {
    return byCode(ref) ?? byName(ref) ?? SOPORTE_TI_ESTADOS[0]
  }
  if (ref.estadoId != null) return byId(ref.estadoId) ?? SOPORTE_TI_ESTADOS[0]
  if (ref.estadoCodigo) return byCode(ref.estadoCodigo) ?? SOPORTE_TI_ESTADOS[0]
  if (ref.estado) return byName(ref.estado) ?? SOPORTE_TI_ESTADOS[0]
  return SOPORTE_TI_ESTADOS[0]
}
