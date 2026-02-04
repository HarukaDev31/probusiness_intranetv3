import { CalendarService } from "~/services/calendar/calendarService"
import type { CalendarEvent, CreateEventRequest, UpdateEventRequest, MoveEventRequest, CalendarFilters } from "~/types/calendar"
import { ref, computed } from 'vue'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useUserRole } from '~/composables/auth/useUserRole'
import { DEFAULT_RESPONSABLE_COLORS } from '~/constants/calendar'

const { withSpinner } = useSpinner()

// Colores por defecto para prioridades
const PRIORITY_COLORS: Record<number, string> = {
  0: '#22c55e', // Verde - Bajo
  1: '#f59e0b', // Amarillo - Medio
  2: '#ef4444'  // Rojo - Alto
}

export const useCalendar = () => {
  const events = ref<CalendarEvent[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const { currentRole, currentId } = useUserRole()

  // Transformar evento del backend para agregar campos necesarios para el calendario
  const transformEvent = (event: CalendarEvent): CalendarEvent => {
    // Alias title para name
    const title = event.name || event.title || 'Sin título'
    
    // Calcular color basado en el primer responsable o prioridad
    let color = '#3b82f6' // Azul por defecto
    
    if (event.charges && event.charges.length > 0) {
      const firstCharge = event.charges[0]
      // Buscar color del usuario en config o usar default
      if (firstCharge.user?.color) {
        color = firstCharge.user.color
      } else if (firstCharge.user?.nombre && DEFAULT_RESPONSABLE_COLORS[firstCharge.user.nombre]) {
        color = DEFAULT_RESPONSABLE_COLORS[firstCharge.user.nombre]
      }
    } else {
      // Si no hay responsables, usar color por prioridad
      color = PRIORITY_COLORS[event.priority] || color
    }

    // Calcular start_date y end_date desde days si no existen
    let startDate = event.start_date
    let endDate = event.end_date
    
    if (!startDate && event.days && event.days.length > 0) {
      const sortedDays = [...event.days].sort((a, b) => a.date.localeCompare(b.date))
      startDate = sortedDays[0].date
      endDate = sortedDays[sortedDays.length - 1].date
    }

    return {
      ...event,
      title,
      color,
      start_date: startDate,
      end_date: endDate || startDate,
      is_all_day: true, // Por defecto las actividades son de todo el día
    }
  }

  // Obtener colores de todos los responsables de un evento
  const getEventColors = (event: CalendarEvent): string[] => {
    if (!event.charges || event.charges.length === 0) {
      // Color por prioridad si no hay responsables
      return [PRIORITY_COLORS[event.priority] || '#3b82f6']
    }
    
    return event.charges.map(charge => {
      if (charge.user?.color) {
        return charge.user.color
      }
      if (charge.user?.nombre && DEFAULT_RESPONSABLE_COLORS[charge.user.nombre]) {
        return DEFAULT_RESPONSABLE_COLORS[charge.user.nombre]
      }
      return '#6B7280' // Gris por defecto
    })
  }

  // Obtener la posición de un evento en un día específico
  const getEventPosition = (event: CalendarEvent, dateStr: string): 'start' | 'middle' | 'end' | 'single' | null => {
    const startDate = event.start_date
    const endDate = event.end_date
    
    if (!startDate || !endDate) return null
    if (dateStr < startDate || dateStr > endDate) return null
    
    if (startDate === endDate) return 'single'
    if (dateStr === startDate) return 'start'
    if (dateStr === endDate) return 'end'
    return 'middle'
  }

  // Verificar si un evento está en un día específico
  const isEventOnDate = (event: CalendarEvent, dateStr: string): boolean => {
    const startDate = event.start_date
    const endDate = event.end_date
    if (!startDate || !endDate) return false
    return dateStr >= startDate && dateStr <= endDate
  }

  const getEvents = async (filters?: CalendarFilters) => {
    try {
      loading.value = true
      error.value = null
      const response = await CalendarService.getEvents(filters)
      // Transformar eventos para agregar campos necesarios
      events.value = (response.data || []).map(transformEvent)
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
      // Si el evento tiene charges (responsables asignados), verificar si el usuario actual está asignado
      if (event.charges && event.charges.length > 0) {
        const isAssigned = event.charges.some(charge => charge.user_id === Number(currentId.value))
        if (isAssigned) {
          return true
        }
      }
      
      // Si es público, todos pueden verlo
      if (event.is_public) {
        return true
      }
      
      // Si es para el usuario actual (legacy)
      if (event.is_for_me && event.created_by === Number(currentId.value)) {
        return true
      }
      
      // Si es para el rol del usuario actual (legacy)
      if (event.role_name && event.role_name === currentRole.value) {
        return true
      }
      
      // Si el usuario es el creador
      if (event.created_by === Number(currentId.value)) {
        return true
      }

      const hasLegacyFields = event.is_public !== undefined || 
                              event.is_for_me !== undefined || 
                              event.role_name !== undefined || 
                              event.created_by !== undefined
      if (!hasLegacyFields) {
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
    moveEvent,
    // Utilidades para eventos multi-día
    getEventColors,
    getEventPosition,
    isEventOnDate
  }
}

