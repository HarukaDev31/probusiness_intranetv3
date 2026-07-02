import type { ProveedorManualStatus } from './types'

export const BACKEND_FILES_BASE_URL = 'https://intranetback.probusiness.pe/files/'
export const EMPTY_MAX_DOCUMENTACION_DATE = '00/00/0000'

export const PROVIDER_MANUAL_STATUSES: ProveedorManualStatus[] = ['Pendiente', 'Recibido', 'Observado', 'Revisado']

export const MANUAL_STATUS_TO_STATUS_BG_KEY: Record<ProveedorManualStatus, string> = {
  Pendiente: 'WAIT',
  Recibido: 'RECIBIENDO',
  Observado: 'Incompleto',
  Revisado: 'Completado',
}

export const READ_ONLY_COLUMN_KEYS = new Set(['acciones', 'action', 'actions'])
