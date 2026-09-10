export const DEFAULT_BASE_PATH = '/cargaconsolidada/abiertos'
export const GINO_USER_ID = 28791

/** Opciones de filas por página en listado de abiertos. */
export const ABIERTOS_PAGINATION_OPTIONS = [5, 10, 20, 100] as const

export const ALMACEN_STATUS_OPTIONS = [
  { label: 'Todos', value: 'todos' },
  { label: 'WAITING', value: 'WAITING' },
  { label: 'RECEIVING', value: 'RECEIVING' },
  { label: 'FINISH', value: 'FINISH' },
] as const

export const CHINA_STATUS_OPTIONS = [
  { label: 'PENDIENTE', value: 'PENDIENTE' },
  { label: 'RECIBIENDO', value: 'RECIBIENDO' },
  { label: 'COMPLETADO', value: 'COMPLETADO' },
] as const

export const DOCUMENTACION_STATUS_OPTIONS = [
  { label: 'PENDIENTE', value: 'PENDIENTE' },
  { label: 'DOCUMENTACION', value: 'DOCUMENTACION' },
  { label: 'COMPLETADO', value: 'COMPLETADO' },
] as const

export const FINANZAS_STATUS_OPTIONS = [
  { label: 'Todos', value: 'todos' },
  { label: 'PENDIENTE', value: 'PENDIENTE' },
  { label: 'COMPLETADO', value: 'COMPLETADO' },
] as const
