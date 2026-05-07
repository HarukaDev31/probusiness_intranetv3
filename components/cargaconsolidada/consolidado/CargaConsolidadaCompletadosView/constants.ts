export const DEFAULT_BASE_PATH = '/cargaconsolidada/completados'
export const GINO_USER_ID = 28791

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

export const ESTADO_LABEL_MAP_ALMACEN: Record<string, string> = {
  PENDIENTE: 'WAITING',
  RECIBIENDO: 'RECEIVING',
  COMPLETADO: 'FINISH',
  WAITING: 'WAITING',
  RECEIVING: 'RECEIVING',
  FINISH: 'FINISH',
}

export const ESTADO_LABEL_MAP_DEFAULT: Record<string, string> = {
  WAITING: 'PENDIENTE',
  RECEIVING: 'RECIBIENDO',
  FINISH: 'COMPLETADO',
  PENDIENTE: 'PENDIENTE',
  RECIBIENDO: 'RECIBIENDO',
  COMPLETADO: 'COMPLETADO',
}
