import type { ProveedorManualStatus } from './types'

export const BACKEND_FILES_BASE_URL = 'https://intranetback.probusiness.pe/files/'
export const EMPTY_MAX_DOCUMENTACION_DATE = '00/00/0000'

/** Cuenta Coord 2 (Daniela): edita invoice/packing/excel_conf_status (no el VB final). */
export const COORD2_DOCS_EMAIL = 'coordinacion2@probusiness.pe'
/** Cuenta Coord 3 (José): edita el VB final (invoice/packing/excel_conf_status_final). */
export const COORD3_DOCS_EMAIL = 'coordinacion3@probusiness.pe'

export const PROVIDER_MANUAL_STATUSES: ProveedorManualStatus[] = ['Pendiente', 'Solicitado', 'Entregado', 'Observado', 'Revisado']

export const MANUAL_STATUS_TO_STATUS_BG_KEY: Record<ProveedorManualStatus, string> = {
  Pendiente: 'WAIT',
  Solicitado: 'SOLICITADO_SEGUIMIENTO',
  Entregado: 'ENTREGADO_SEGUIMIENTO',
  Observado: 'Incompleto',
  Revisado: 'Completado',
}

/** Colores exactos de la maqueta validada para Invoice / Packing list / Excel Conf. */
export const DOC_STATUS_COLORS: Record<ProveedorManualStatus, { text: string; bg: string }> = {
  Pendiente: { text: '#6B7280', bg: '#E7E9EE' },
  Solicitado: { text: '#96690A', bg: '#FBE8B3' },
  Entregado: { text: '#1B4FA0', bg: '#DCE6FA' },
  Observado: { text: '#C0392B', bg: '#FBE0DD' },
  Revisado: { text: '#1F8A55', bg: '#DCF3E6' },
}

export type CanalSeguimiento = 'Bitrix' | 'Api'

export const CANAL_OPTIONS: CanalSeguimiento[] = ['Bitrix', 'Api']

/** Colores exactos de la maqueta validada para la columna Canal. */
export const CANAL_COLORS: Record<CanalSeguimiento, { text: string; bg: string }> = {
  Bitrix: { text: '#2B6FD6', bg: '#E2EBFC' },
  Api: { text: '#1F8A55', bg: '#DCF3E6' },
}

export const READ_ONLY_COLUMN_KEYS = new Set(['acciones', 'action', 'actions'])

/** Extrae posibles emails/usuarios del auth_user (puede estar en email, Txt_Email o No_Usuario). */
export function collectUserLoginEmails(user: unknown): string[] {
  if (!user || typeof user !== 'object') return []
  const u = user as Record<string, unknown>
  const raw = (u.raw && typeof u.raw === 'object' ? u.raw : {}) as Record<string, unknown>
  const candidates = [
    u.email,
    raw.email,
    raw.Txt_Email,
    raw.No_Usuario,
    raw.txt_email,
    raw.no_usuario,
  ]
  return candidates
    .map((v) => String(v || '').trim().toLowerCase())
    .filter((v) => v !== '')
}

export function isCoord2DocsEmail(emailOrUser: string | null | undefined | unknown): boolean {
  if (emailOrUser && typeof emailOrUser === 'object') {
    return collectUserLoginEmails(emailOrUser).some(
      (e) => e === COORD2_DOCS_EMAIL || e.startsWith('coordinacion2@')
    )
  }
  const email = String(emailOrUser || '').trim().toLowerCase()
  return email === COORD2_DOCS_EMAIL || email.startsWith('coordinacion2@')
}

export function isCoord3DocsEmail(emailOrUser: string | null | undefined | unknown): boolean {
  if (emailOrUser && typeof emailOrUser === 'object') {
    return collectUserLoginEmails(emailOrUser).some(
      (e) => e === COORD3_DOCS_EMAIL || e.startsWith('coordinacion3@')
    )
  }
  const email = String(emailOrUser || '').trim().toLowerCase()
  return email === COORD3_DOCS_EMAIL || email.startsWith('coordinacion3@')
}
