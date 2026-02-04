import { BaseService } from "../base/BaseService"
import type {
  CalendarEvent,
  CalendarFilters,
  CalendarResponse,
  CalendarEventResponse,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
  UpdateChargeStatusRequest,
  UpdateEventPriorityRequest,
  UpdateChargeNotesRequest,
  UpdateUserColorRequest,
  ResponsablesResponse,
  ColorConfigResponse,
  ContenedoresResponse,
  ProgressResponse,
  ChargeTrackingResponse,
  CalendarResponsable,
  CalendarUserColorConfig,
  CalendarContenedor,
  CalendarEventChargeTracking,
  // Legacy
  CreateEventRequest,
  UpdateEventRequest,
  MoveEventRequest
} from "~/types/calendar"

export class CalendarService extends BaseService {
  private static baseUrl = 'api/calendar'

  // ============================================
  // EVENTOS/ACTIVIDADES
  // ============================================

  /**
   * Construye query string para GET; arrays se envían como key[]=val para que Laravel los reciba como array.
   */
  private static buildCalendarQueryString(filters?: CalendarFilters): string {
    if (!filters || Object.keys(filters).length === 0) return ''
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      if (key === 'contenedor_ids' && Array.isArray(value)) {
        value.forEach((id: number) => params.append('contenedor_ids[]', String(id)))
      } else {
        params.append(key, String(value))
      }
    })
    const qs = params.toString()
    return qs ? `?${qs}` : ''
  }

  /**
   * Obtener eventos/actividades con filtros
   */
  static async getEvents(filters?: CalendarFilters): Promise<CalendarResponse> {
    try {
      const query = this.buildCalendarQueryString(filters)
      const response = await this.apiCall<CalendarResponse>(`${this.baseUrl}/events${query}`, {
        method: 'GET'
      })
      return response
    } catch (error) {
      console.error('Error al obtener eventos:', error)
      throw error
    }
  }

  /**
   * Obtener un evento específico
   */
  static async getEvent(id: number): Promise<CalendarEvent> {
    try {
      const response = await this.apiCall<CalendarEventResponse>(`${this.baseUrl}/events/${id}`, {
        method: 'GET'
      })
      return response.data
    } catch (error) {
      console.error('Error al obtener evento:', error)
      throw error
    }
  }

  /**
   * Crear una nueva actividad
   */
  static async createActivity(data: CreateCalendarEventRequest): Promise<CalendarEvent> {
    try {
      const response = await this.apiCall<CalendarEventResponse>(`${this.baseUrl}/activities`, {
        method: 'POST',
        body: data
      })
      return response.data
    } catch (error) {
      console.error('Error al crear actividad:', error)
      throw error
    }
  }

  /**
   * Actualizar una actividad
   */
  static async updateActivity(data: UpdateCalendarEventRequest): Promise<CalendarEvent> {
    try {
      const response = await this.apiCall<CalendarEventResponse>(`${this.baseUrl}/activities/${data.id}`, {
        method: 'PUT',
        body: data
      })
      return response.data
    } catch (error) {
      console.error('Error al actualizar actividad:', error)
      throw error
    }
  }

  /**
   * Eliminar una actividad
   */
  static async deleteActivity(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; message?: string }>(`${this.baseUrl}/activities/${id}`, {
        method: 'DELETE'
      })
      return response
    } catch (error) {
      console.error('Error al eliminar actividad:', error)
      throw error
    }
  }

  // ============================================
  // ESTADOS Y PRIORIDADES
  // ============================================

  /**
   * Actualizar estado de un charge (responsable asignado)
   */
  static async updateChargeStatus(data: UpdateChargeStatusRequest): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; message?: string }>(`${this.baseUrl}/charges/${data.charge_id}/status`, {
        method: 'PUT',
        body: { status: data.status }
      })
      return response
    } catch (error) {
      console.error('Error al actualizar estado:', error)
      throw error
    }
  }

  /**
   * Actualizar prioridad de un evento (solo Jefe de Importaciones)
   */
  static async updateEventPriority(data: UpdateEventPriorityRequest): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; message?: string }>(`${this.baseUrl}/activities/${data.event_id}/priority`, {
        method: 'PUT',
        body: { priority: data.priority }
      })
      return response
    } catch (error) {
      console.error('Error al actualizar prioridad:', error)
      throw error
    }
  }

  // ============================================
  // NOTAS
  // ============================================

  /**
   * Actualizar notas de un charge
   */
  static async updateChargeNotes(data: UpdateChargeNotesRequest): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; message?: string }>(`${this.baseUrl}/charges/${data.charge_id}/notes`, {
        method: 'PUT',
        body: { notes: data.notes }
      })
      return response
    } catch (error) {
      console.error('Error al actualizar notas:', error)
      throw error
    }
  }

  /**
   * Actualizar notas generales del evento
   */
  static async updateEventNotes(eventId: number, notes: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; message?: string }>(`${this.baseUrl}/activities/${eventId}/notes`, {
        method: 'PUT',
        body: { notes }
      })
      return response
    } catch (error) {
      console.error('Error al actualizar notas del evento:', error)
      throw error
    }
  }

  // ============================================
  // RESPONSABLES
  // ============================================

  /**
   * Obtener lista de responsables disponibles (perfiles coordinación/documentación)
   */
  static async getResponsables(): Promise<CalendarResponsable[]> {
    try {
      const response = await this.apiCall<ResponsablesResponse>(`${this.baseUrl}/responsables`, {
        method: 'GET'
      })
      return response.data
    } catch (error) {
      console.error('Error al obtener responsables:', error)
      throw error
    }
  }

  /**
   * Asignar responsable a un evento
   */
  static async assignResponsable(eventId: number, userId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; message?: string }>(`${this.baseUrl}/activities/${eventId}/responsables`, {
        method: 'POST',
        body: { user_id: userId }
      })
      return response
    } catch (error) {
      console.error('Error al asignar responsable:', error)
      throw error
    }
  }

  /**
   * Remover responsable de un evento
   */
  static async removeResponsable(eventId: number, userId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; message?: string }>(`${this.baseUrl}/activities/${eventId}/responsables/${userId}`, {
        method: 'DELETE'
      })
      return response
    } catch (error) {
      console.error('Error al remover responsable:', error)
      throw error
    }
  }

  // ============================================
  // CONFIGURACIÓN DE COLORES
  // ============================================

  /**
   * Obtener configuración de colores de usuarios
   */
  static async getColorConfig(): Promise<CalendarUserColorConfig[]> {
    try {
      const response = await this.apiCall<ColorConfigResponse>(`${this.baseUrl}/colors`, {
        method: 'GET'
      })
      return response.data
    } catch (error) {
      console.error('Error al obtener configuración de colores:', error)
      throw error
    }
  }

  /**
   * Actualizar color de un usuario
   */
  static async updateUserColor(data: UpdateUserColorRequest): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; message?: string }>(`${this.baseUrl}/colors`, {
        method: 'PUT',
        body: data
      })
      return response
    } catch (error) {
      console.error('Error al actualizar color:', error)
      throw error
    }
  }

  // ============================================
  // CONTENEDORES
  // ============================================

  /**
   * Obtener contenedores disponibles para filtro
   */
  static async getContenedores(): Promise<CalendarContenedor[]> {
    try {
      const response = await this.apiCall<ContenedoresResponse>(`${this.baseUrl}/contenedores`, {
        method: 'GET'
      })
      return response.data
    } catch (error) {
      console.error('Error al obtener contenedores:', error)
      throw error
    }
  }

  // ============================================
  // CATÁLOGO DE ACTIVIDADES
  // ============================================

  /**
   * Obtener catálogo de actividades predefinidas
   */
  static async getActivityCatalog(): Promise<{ id: number; name: string }[]> {
    try {
      const response = await this.apiCall<{ success: boolean; data: { id: number; name: string }[] }>(`${this.baseUrl}/activity-catalog`, {
        method: 'GET'
      })
      return response.data
    } catch (error) {
      console.error('Error al obtener catálogo de actividades:', error)
      throw error
    }
  }

  /**
   * Crear una nueva actividad en el catálogo
   */
  static async createActivityCatalog(name: string): Promise<{ id: number; name: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; data: { id: number; name: string } }>(`${this.baseUrl}/activity-catalog`, {
        method: 'POST',
        body: { name }
      })
      return response.data
    } catch (error) {
      console.error('Error al crear actividad en catálogo:', error)
      throw error
    }
  }

  /**
   * Actualizar nombre de actividad del catálogo
   */
  static async updateActivityCatalog(id: number, name: string): Promise<{ id: number; name: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; data: { id: number; name: string } }>(`${this.baseUrl}/activity-catalog/${id}`, {
        method: 'PUT',
        body: { name }
      })
      return response.data
    } catch (error) {
      console.error('Error al actualizar actividad del catálogo:', error)
      throw error
    }
  }

  /**
   * Eliminar actividad del catálogo
   */
  static async deleteActivityCatalog(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; message?: string }>(`${this.baseUrl}/activity-catalog/${id}`, {
        method: 'DELETE'
      })
      return response
    } catch (error) {
      console.error('Error al eliminar actividad del catálogo:', error)
      throw error
    }
  }

  // ============================================
  // PROGRESO / ESTADÍSTICAS
  // ============================================

  /**
   * Obtener estadísticas de progreso
   */
  static async getProgress(filters?: CalendarFilters): Promise<ProgressResponse['data']> {
    try {
      const response = await this.apiCall<ProgressResponse>(`${this.baseUrl}/progress`, {
        method: 'GET',
        params: filters
      })
      return response.data
    } catch (error) {
      console.error('Error al obtener progreso:', error)
      throw error
    }
  }

  // ============================================
  // TRACKING / HISTORIAL
  // ============================================

  /**
   * Obtener historial de cambios de estado de un charge específico
   */
  static async getChargeTracking(chargeId: number): Promise<CalendarEventChargeTracking[]> {
    try {
      const response = await this.apiCall<ChargeTrackingResponse>(`${this.baseUrl}/charges/${chargeId}/tracking`, {
        method: 'GET'
      })
      return response.data
    } catch (error) {
      console.error('Error al obtener tracking del charge:', error)
      throw error
    }
  }

  /**
   * Obtener historial de cambios de estado de una actividad completa
   * (todos los charges de esa actividad)
   */
  static async getActivityTracking(activityId: number): Promise<CalendarEventChargeTracking[]> {
    try {
      const response = await this.apiCall<ChargeTrackingResponse>(`${this.baseUrl}/activities/${activityId}/tracking`, {
        method: 'GET'
      })
      return response.data
    } catch (error) {
      console.error('Error al obtener tracking de la actividad:', error)
      throw error
    }
  }

  // ============================================
  // MÉTODOS LEGACY (compatibilidad)
  // ============================================

  static async createEvent(data: CreateEventRequest): Promise<CalendarEvent> {
    try {
      const response = await this.apiCall<CalendarEvent>(`${this.baseUrl}/events`, {
        method: 'POST',
        body: data
      })
      return response
    } catch (error) {
      console.error('Error al crear evento:', error)
      throw error
    }
  }

  static async updateEvent(data: UpdateEventRequest): Promise<CalendarEvent> {
    try {
      if (data.task_day_id) {
        const response = await this.apiCall<CalendarEvent>(`${this.baseUrl}/task-days/${data.task_day_id}`, {
          method: 'PUT',
          body: data
        })
        return response
      }
      
      const response = await this.apiCall<CalendarEvent>(`${this.baseUrl}/events/${data.id}`, {
        method: 'PUT',
        body: data
      })
      return response
    } catch (error) {
      console.error('Error al actualizar evento:', error)
      throw error
    }
  }

  static async deleteEvent(id: number, taskDayId?: number): Promise<{ success: boolean; message?: string }> {
    try {
      if (taskDayId) {
        const response = await this.apiCall<{ success: boolean; message?: string }>(`${this.baseUrl}/task-days/${taskDayId}`, {
          method: 'DELETE'
        })
        return response
      }
      
      const response = await this.apiCall<{ success: boolean; message?: string }>(`${this.baseUrl}/events/${id}`, {
        method: 'DELETE'
      })
      return response
    } catch (error) {
      console.error('Error al eliminar evento:', error)
      throw error
    }
  }

  static async moveEvent(data: MoveEventRequest): Promise<CalendarEvent> {
    try {
      const response = await this.apiCall<CalendarEvent>(`${this.baseUrl}/events/${data.id}/move`, {
        method: 'PUT',
        body: {
          start_date: data.start_date,
          end_date: data.end_date,
          start_time: data.start_time,
          end_time: data.end_time
        }
      })
      return response
    } catch (error) {
      console.error('Error al mover evento:', error)
      throw error
    }
  }
}
