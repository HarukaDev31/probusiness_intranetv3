// Tipos para el panel de preferencias de notificaciones websocket.
// Solo aplica a avisos en vivo (modal / sonido / navegador).
// NO afecta la campana ni las notificaciones persistidas.

export type WsNotificationChannel = 'modal' | 'sonido' | 'navegador'

export interface WsNotificationType {
  /** Clave estable del evento socket (debe coincidir con backend). */
  key: string
  /** Etiqueta legible para el usuario. */
  label: string
  /** Texto de apoyo opcional. */
  descripcion?: string
  /** Módulo para agrupar en el panel. */
  modulo: string
  /** Canales que este tipo puede usar. */
  canales: WsNotificationChannel[]
  /** Si es false, el usuario no puede desactivarlo (avisos críticos). */
  silenciable: boolean
  /** Valor por defecto por canal cuando el usuario no lo ha configurado. */
  defaults: Partial<Record<WsNotificationChannel, boolean>>
}

/** Registro persistido en backend (override del usuario). */
export interface WsNotificationPreferenceRecord {
  notification_key: string
  canal: WsNotificationChannel
  habilitado: boolean
}

export interface WsNotificationPreferencesResponse {
  success: boolean
  data: WsNotificationPreferenceRecord[]
  message?: string
}

export interface WsNotificationPreferencesActionResponse {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}
