import { CalendarService } from "~/services/calendar/calendarService"
import type { CalendarEvent, CreateEventRequest, UpdateEventRequest, MoveEventRequest, CalendarFilters } from "~/types/calendar"
import { ref, computed } from 'vue'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useUserRole } from '~/composables/auth/useUserRole'

const { withSpinner } = useSpinner()

export const useCalendar = () => {
  const events = ref<CalendarEvent[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const { currentRole, currentId } = useUserRole()

  const getEvents = async (filters?: CalendarFilters) => {
    try {
      loading.value = true
      error.value = null
      const response = await CalendarService.getEvents(filters)
      events.value = response.data || []
    } catch (err: any) {
      error.value = err?.message || 'Error al cargar eventos'
      console.error('Error en getEvents:', err)
    } finally {
      loading.value = false
    }
  }

  const getEvent = async (id: number): Promise<CalendarEvent | null> => {
    try {
      loading.value = true
      error.value = null
      const event = await CalendarService.getEvent(id)
      return event
    } catch (err: any) {
      error.value = err?.message || 'Error al cargar evento'
      console.error('Error en getEvent:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const createEvent = async (data: CreateEventRequest): Promise<CalendarEvent | null> => {
    try {
      loading.value = true
      error.value = null
      const event = await withSpinner(
        () => CalendarService.createEvent(data),
        'Creando evento...'
      )
      
      // Si es una tarea, el backend devuelve la tarea principal
      // Los días se cargarán en la próxima consulta de getEvents
      // Por ahora, solo agregamos el evento principal si es un evento normal
      if (data.type === 'evento') {
        events.value.push(event)
      }
      // Si es tarea, recargamos los eventos para obtener todos los días
      if (data.type === 'tarea') {
        // Los días se cargarán automáticamente en la próxima consulta
      }
      
      return event
    } catch (err: any) {
      error.value = err?.message || 'Error al crear evento'
      console.error('Error en createEvent:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const updateEvent = async (data: UpdateEventRequest): Promise<CalendarEvent | null> => {
    try {
      loading.value = true
      error.value = null
      const event = await withSpinner(
        () => CalendarService.updateEvent(data),
        'Actualizando evento...'
      )
      // Actualizar el evento en la lista
      if (data.task_day_id) {
        // Si es un día de tarea, buscar por task_day_id
        const index = events.value.findIndex(e => e.task_day_id === data.task_day_id)
        if (index !== -1) {
          events.value[index] = event
        } else {
          // Si no existe, agregarlo
          events.value.push(event)
        }
      } else {
        // Si es un evento normal, buscar por id
        const index = events.value.findIndex(e => e.id === event.id)
        if (index !== -1) {
          events.value[index] = event
        }
      }
      return event
    } catch (err: any) {
      error.value = err?.message || 'Error al actualizar evento'
      console.error('Error en updateEvent:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const deleteEvent = async (id: number, taskDayId?: number): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null
      await withSpinner(
        () => CalendarService.deleteEvent(id, taskDayId),
        'Eliminando evento...'
      )
      // Remover el evento de la lista
      if (taskDayId) {
        events.value = events.value.filter(e => e.task_day_id !== taskDayId)
      } else {
        events.value = events.value.filter(e => e.id !== id)
      }
      return true
    } catch (err: any) {
      error.value = err?.message || 'Error al eliminar evento'
      console.error('Error en deleteEvent:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const moveEvent = async (data: MoveEventRequest): Promise<CalendarEvent | null> => {
    try {
      loading.value = true
      error.value = null
      const event = await CalendarService.moveEvent(data)
      // Actualizar el evento en la lista
      const index = events.value.findIndex(e => e.id === event.id)
      if (index !== -1) {
        events.value[index] = event
      }
      return event
    } catch (err: any) {
      error.value = err?.message || 'Error al mover evento'
      console.error('Error en moveEvent:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Filtrar eventos visibles según permisos
  const visibleEvents = computed(() => {
    return events.value.filter(event => {
      // Si es público, todos pueden verlo
      if (event.is_public) {
        return true
      }
      // Si es para el usuario actual
      if (event.is_for_me && event.created_by === Number(currentId.value)) {
        return true
      }
      // Si es para el rol del usuario actual
      if (event.role_name && event.role_name === currentRole.value) {
        return true
      }
      // Si el usuario es el creador
      if (event.created_by === Number(currentId.value)) {
        return true
      }
      return false
    })
  })

  return {
    events,
    visibleEvents,
    loading,
    error,
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    moveEvent
  }
}

