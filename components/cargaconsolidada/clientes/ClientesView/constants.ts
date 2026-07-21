import type { ProveedorManualStatus } from './types'

export const BACKEND_FILES_BASE_URL = 'https://intranetback.probusiness.pe/files/'
export const EMPTY_MAX_DOCUMENTACION_DATE = '00/00/0000'

/** Cuenta Coord 2: edita invoice/packing/excel_conf_status (no el VB final). */
export const COORD2_DOCS_EMAIL = 'coordinacion2@probusiness.pe'

export const PROVIDER_MANUAL_STATUSES: ProveedorManualStatus[] = ['Pendiente', 'Recibido', 'Observado', 'Revisado']

export const MANUAL_STATUS_TO_STATUS_BG_KEY: Record<ProveedorManualStatus, string> = {
  Pendiente: 'WAIT',
  Recibido: 'RECIBIENDO',
  Observado: 'Incompleto',
  Revisado: 'Completado',
}

export const READ_ONLY_COLUMN_KEYS = new Set(['acciones', 'action', 'actions'])

export function isCoord2DocsEmail(email: string | null | undefined): boolean {
  return String(email || '').trim().toLowerCase() === COORD2_DOCS_EMAIL
}
