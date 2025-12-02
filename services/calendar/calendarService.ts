import { BaseService } from "../base/BaseService"
import type { CalendarEvent, CreateEventRequest, UpdateEventRequest, MoveEventRequest, CalendarResponse, CalendarFilters } from "~/types/calendar"

export class CalendarService extends BaseService {
  private static baseUrl = 'api/calendar'

  static async getEvents(filters?: CalendarFilters): Promise<CalendarResponse> {
    try {
      const response = await this.apiCall<CalendarResponse>(`${this.baseUrl}/events`, {
        method: 'GET',
        params: filters
      })
      return response
    } catch (error) {
      console.error('Error al obtener eventos:', error)
      throw error
    }
  }

  static async getEvent(id: number): Promise<CalendarEvent> {
    try {
      const response = await this.apiCall<CalendarEvent>(`${this.baseUrl}/events/${id}`, {
        method: 'GET'
      })
      return response
    } catch (error) {
      console.error('Error al obtener evento:', error)
      throw error
    }
  }

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
      // Si tiene task_day_id, usar la ruta de task-days
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
      // Si tiene task_day_id, usar la ruta de task-days
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

