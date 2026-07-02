/** Roles de la vista según permisos del usuario en intranet. */
export const SOPORTE_TI_ROLES = ['Solicitante', 'PM', 'Analista'] as const
export type SoporteTiRol = (typeof SOPORTE_TI_ROLES)[number]

export const SOPORTE_TI_FASES_A = [
  'Levantamiento',
  'Maqueta',
  'Configuración',
  'Pruebas',
  'Capacitación'
] as const

export const SOPORTE_TI_AREAS = [
  'Ventas',
  'Importaciones',
  'Marketing',
  'Administración y Finanzas',
  'RR.HH',
  'CEO'
] as const

export const SOPORTE_TI_AREA_DEFAULT = 'Ventas'

export { SOPORTE_TI_KANBAN_COLUMNAS } from '~/constants/soporteTiEstados'

/** Color por rol para burbujas de chat (el nombre sale del usuario autenticado). */
export const SOPORTE_TI_ROL_META: Record<SoporteTiRol, { color: string }> = {
  Solicitante: { color: '#6d28d9' },
  PM: { color: '#1d4ed8' },
  Analista: { color: '#047857' }
}

/** Iniciales para burbujas de chat a partir del nombre visible */
export function soporteTiInicialesDesdeNombre(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean)
  if (palabras.length >= 2) {
    return (palabras[0][0] + palabras[1][0]).toUpperCase()
  }
  return nombre.trim().slice(0, 2).toUpperCase() || 'U'
}

/** Canal privado Laravel Echo: `private-soporte-ti.chat.{chatUuid}` */
export const soporteTiChatChannelName = (chatUuid: string) => `soporte-ti.chat.${chatUuid}`

/** Eventos broadcast desde Laravel (ShouldBroadcast). */
export const SOPORTE_TI_WS_EVENTS = {
  MENSAJE_CREADO: 'SoporteTiMensajeCreado',
  MENSAJE_ACTUALIZADO: 'SoporteTiMensajeActualizado',
  ESTADO_ACTUALIZADO: 'SoporteTiEstadoActualizado',
  MENSAJES_LEIDOS: 'SoporteTiMensajesLeidos'
} as const

export const SOPORTE_TI_MAX_IMAGENES_CHAT = 5
export const SOPORTE_TI_MAX_IMAGEN_MB = 10

/** Mensajes por página al abrir el chat o cargar historial */
export const SOPORTE_TI_CHAT_PAGE_SIZE = 25
