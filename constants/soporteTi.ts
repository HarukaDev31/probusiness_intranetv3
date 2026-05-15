/** Roles de demostración (en producción vendrían del usuario y permisos). */
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

/** Avatar / color por rol (demo). */
export const SOPORTE_TI_ROL_META: Record<
  SoporteTiRol,
  { iniciales: string; nombre: string; color: string }
> = {
  Solicitante: { iniciales: 'MT', nombre: 'María Torres', color: '#6d28d9' },
  PM: { iniciales: 'JM', nombre: 'Jorge M.', color: '#1d4ed8' },
  Analista: { iniciales: 'AT', nombre: 'Ana T.', color: '#047857' }
}

/** Solicitante demo para filtrar “mis solicitudes”. */
export const SOPORTE_TI_DEMO_SOLICITANTE = 'María Torres'

/** Canal privado Laravel Echo: `private-soporte-ti.chat.{chatUuid}` */
export const soporteTiChatChannelName = (chatUuid: string) => `soporte-ti.chat.${chatUuid}`

/** Eventos broadcast desde Laravel (ShouldBroadcast). */
export const SOPORTE_TI_WS_EVENTS = {
  MENSAJE_CREADO: 'SoporteTiMensajeCreado',
  MENSAJE_ACTUALIZADO: 'SoporteTiMensajeActualizado',
  ESTADO_ACTUALIZADO: 'SoporteTiEstadoActualizado'
} as const

export const SOPORTE_TI_MAX_IMAGENES_CHAT = 5
export const SOPORTE_TI_MAX_IMAGEN_MB = 10

/** Mensajes por página al abrir el chat o cargar historial */
export const SOPORTE_TI_CHAT_PAGE_SIZE = 25
