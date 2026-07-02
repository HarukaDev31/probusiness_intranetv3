import type { SoporteTiTipo } from '~/types/soporteTi'

/** Catálogo alineado con tabla `soporte_ti_estados` en Laravel. */
export interface SoporteTiEstadoDef {
  id: number
  codigo: string
  nombre: string
  /** null = aplica a tipo A y B */
  tipoSolicitud: SoporteTiTipo | null
  ordenKanban: number | null
  colorBadge?: string
}

export const SOPORTE_TI_ESTADOS: SoporteTiEstadoDef[] = [
  { id: 1, codigo: 'pendiente', nombre: 'Pendiente', tipoSolicitud: null, ordenKanban: 1 },
  { id: 2, codigo: 'en_maqueta', nombre: 'En maqueta', tipoSolicitud: 'A', ordenKanban: 2 },
  { id: 3, codigo: 'en_progreso', nombre: 'En progreso', tipoSolicitud: null, ordenKanban: 3 },
  { id: 4, codigo: 'hecho', nombre: 'Hecho', tipoSolicitud: 'B', ordenKanban: 4 },
  { id: 5, codigo: 'desplegado', nombre: 'Desplegado', tipoSolicitud: null, ordenKanban: 5 },
  { id: 6, codigo: 'observado', nombre: 'Observado', tipoSolicitud: null, ordenKanban: 6 },
  { id: 7, codigo: 'operativo', nombre: 'Operativo', tipoSolicitud: null, ordenKanban: 7 }
]

export const SOPORTE_TI_ESTADOS_POR_ID = Object.fromEntries(
  SOPORTE_TI_ESTADOS.map((e) => [e.id, e])
) as Record<number, SoporteTiEstadoDef>

export const SOPORTE_TI_ESTADOS_POR_CODIGO = Object.fromEntries(
  SOPORTE_TI_ESTADOS.map((e) => [e.codigo, e])
) as Record<string, SoporteTiEstadoDef>

export const SOPORTE_TI_ESTADOS_POR_NOMBRE = Object.fromEntries(
  SOPORTE_TI_ESTADOS.map((e) => [e.nombre, e])
) as Record<string, SoporteTiEstadoDef>

/** Definición de columnas Kanban (DataTable): `key` === `estadoCodigo` en cada fila */
export const SOPORTE_TI_KANBAN_BOARD = SOPORTE_TI_ESTADOS.filter((e) => e.ordenKanban != null)
  .sort((a, b) => (a.ordenKanban ?? 0) - (b.ordenKanban ?? 0))
  .map((e) => ({ key: e.codigo, label: e.nombre }))

/** Columnas Kanban (solo nombres, orden catálogo). */
export const SOPORTE_TI_KANBAN_COLUMNAS = SOPORTE_TI_ESTADOS.filter((e) => e.ordenKanban != null)
  .sort((a, b) => (a.ordenKanban ?? 0) - (b.ordenKanban ?? 0))
  .map((e) => e.nombre)

export function estadoPorId(id: number): SoporteTiEstadoDef | undefined {
  return SOPORTE_TI_ESTADOS_POR_ID[id]
}

export function estadoPorCodigo(codigo: string): SoporteTiEstadoDef | undefined {
  return SOPORTE_TI_ESTADOS_POR_CODIGO[codigo]
}

export function estadoPorNombre(nombre: string): SoporteTiEstadoDef | undefined {
  return SOPORTE_TI_ESTADOS_POR_NOMBRE[nombre]
}

/** Resuelve id/código/nombre legacy a definición de estado. */
export function resolverEstado(
  ref: { estadoId?: number; estadoCodigo?: string; estado?: string } | string
): SoporteTiEstadoDef {
  if (typeof ref === 'string') {
    return estadoPorCodigo(ref) ?? estadoPorNombre(ref) ?? SOPORTE_TI_ESTADOS[0]
  }
  if (ref.estadoId != null) return estadoPorId(ref.estadoId) ?? SOPORTE_TI_ESTADOS[0]
  if (ref.estadoCodigo) return estadoPorCodigo(ref.estadoCodigo) ?? SOPORTE_TI_ESTADOS[0]
  if (ref.estado) return estadoPorNombre(ref.estado) ?? SOPORTE_TI_ESTADOS[0]
  return SOPORTE_TI_ESTADOS[0]
}
