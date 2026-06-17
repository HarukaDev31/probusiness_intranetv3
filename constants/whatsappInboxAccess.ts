import { ROLES } from '~/constants/roles'

/** Roles con acceso al WhatsApp Inbox (ruta y API). */
export const WA_INBOX_ALLOWED_ROLES: string[] = [
  ROLES.COORDINACION,
  ROLES.CONTABILIDAD,
  ROLES.ADMINISTRACION,
  ROLES.JEFE_IMPORTACIONES
]
