import { BaseService } from '~/services/base/BaseService'
import type {
  WsNotificationPreferenceRecord,
  WsNotificationPreferencesResponse,
  WsNotificationPreferencesActionResponse,
} from '~/types/notifications/preferences'

export class NotificationPreferenceService extends BaseService {
  private static baseUrl = '/api/notificaciones/preferencias'

  /**
   * Obtiene los overrides de preferencias websocket del usuario autenticado.
   */
  static async getPreferences(): Promise<WsNotificationPreferenceRecord[]> {
    try {
      const response = await this.apiCall<WsNotificationPreferencesResponse>(this.baseUrl, {
        method: 'GET',
      })
      return response.data || []
    } catch (error) {
      console.error('Error al obtener preferencias de notificaciones:', error)
      throw error
    }
  }

  /**
   * Guarda (en lote) las preferencias websocket del usuario.
   */
  static async savePreferences(preferencias: WsNotificationPreferenceRecord[]): Promise<void> {
    try {
      await this.apiCall<WsNotificationPreferencesActionResponse>(this.baseUrl, {
        method: 'PUT',
        body: { preferencias },
      })
    } catch (error) {
      console.error('Error al guardar preferencias de notificaciones:', error)
      throw error
    }
  }
}
