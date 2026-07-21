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
