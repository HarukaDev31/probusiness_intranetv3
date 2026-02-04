import { CalendarService } from "~/services/calendar/calendarService"
import type {
  CalendarEvent,
  CalendarFilters,
  CalendarResponsable,
  CalendarContenedor,
  CalendarUserColorConfig,
  CalendarEventStatus,
  CalendarEventPriority,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
  TeamProgress,
  ResponsableProgress
} from "~/types/calendar"
import { ref, computed, watch } from 'vue'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useUserRole } from '~/composables/auth/useUserRole'
import { ROLES, getCalendarPermissions } from '~/constants/roles'
import { DEFAULT_RESPONSABLE_COLORS } from '~/constants/calendar'

const { withSpinner } = useSpinner()

export const useCalendarActivities = () => {
  // Estado
  const activities = ref<CalendarEvent[]>([])
  const responsables = ref<CalendarResponsable[]>([])
  const contenedores = ref<CalendarContenedor[]>([])
  const colorConfig = ref<CalendarUserColorConfig[]>([])
  const activityCatalog = ref<{ id: number; name: string }[]>([])
  const teamProgress = ref<TeamProgress | null>(null)
  const responsableProgress = ref<ResponsableProgress[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Filtros activos
  const filters = ref<CalendarFilters>({
    start_date: undefined,
    end_date: undefined,
    responsable_id: undefined,
    contenedor_id: undefined,
    status: undefined,
    priority: undefined
  })

  // User info
  const { currentRole, currentId, userData } = useUserRole()

  // Permisos del calendario según rol
  const calendarPermissions = computed(() => {
    return getCalendarPermissions(currentRole.value as any)
  })

  // Verificar si es Jefe de Importaciones
  const isJefeImportaciones = computed(() => {
    return currentRole.value === ROLES.JEFE_IMPORTACIONES
  })

  // Verificar si es Coordinación o Documentación
  const isCoordinacionOrDocumentacion = computed(() => {
    return currentRole.value === ROLES.COORDINACION || currentRole.value === ROLES.DOCUMENTACION
  })

  // ============================================
  // ACTIVIDADES
  // ============================================

  // Colores por defecto para prioridades
  const PRIORITY_COLORS: Record<number, string> = {
    0: '#22c55e', // Verde - Bajo
    1: '#f59e0b', // Amarillo - Medio
    2: '#ef4444'  // Rojo - Alto
  }

  // Transformar evento del backend para agregar campos necesarios
  const transformActivity = (event: CalendarEvent): CalendarEvent => {
    // Alias title para name
    const title = event.name || event.title || 'Sin título'
    
    // Calcular color basado en el primer responsable o prioridad
    let color = '#3b82f6' // Azul por defecto
    
    if (event.charges && event.charges.length > 0) {
      const firstCharge = event.charges[0]
      // Buscar color del usuario en colorConfig o en DEFAULT_RESPONSABLE_COLORS
      const userColorConfig = colorConfig.value.find(c => c.user_id === firstCharge.user_id)
      if (userColorConfig) {
        color = userColorConfig.color_code
      } else if (firstCharge.user?.color) {
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
      is_all_day: true,
    }
  }

  const getActivities = async (customFilters?: CalendarFilters) => {
    try {
      loading.value = true
      error.value = null
      const appliedFilters = { ...filters.value, ...customFilters }
      const response = await CalendarService.getEvents(appliedFilters)
      // Transformar actividades para agregar campos necesarios
      activities.value = (response.data || []).map(transformActivity)
    } catch (err: any) {
      error.value = err?.message || 'Error al cargar actividades'
      console.error('Error en getActivities:', err)
    } finally {
      loading.value = false
    }
  }

  const createActivity = async (data: CreateCalendarEventRequest): Promise<CalendarEvent | null> => {
    try {
      loading.value = true
      error.value = null
      const activity = await withSpinner(
        () => CalendarService.createActivity(data),
        'Creando actividad...'
      )
      // Agregar a la lista local
      activities.value.push(activity)
      return activity
    } catch (err: any) {
      error.value = err?.message || 'Error al crear actividad'
      console.error('Error en createActivity:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const updateActivity = async (data: UpdateCalendarEventRequest): Promise<CalendarEvent | null> => {
    try {
      loading.value = true
      error.value = null
      const activity = await withSpinner(
        () => CalendarService.updateActivity(data),
        'Actualizando actividad...'
      )
      // Actualizar en la lista local
      const index = activities.value.findIndex(a => a.id === activity.id)
      if (index !== -1) {
        activities.value[index] = activity
      }
      return activity
    } catch (err: any) {
      error.value = err?.message || 'Error al actualizar actividad'
      console.error('Error en updateActivity:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const deleteActivity = async (id: number): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null
      await withSpinner(
        () => CalendarService.deleteActivity(id),
        'Eliminando actividad...'
      )
      // Remover de la lista local
      activities.value = activities.value.filter(a => a.id !== id)
      return true
    } catch (err: any) {
      error.value = err?.message || 'Error al eliminar actividad'
      console.error('Error en deleteActivity:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // ESTADOS Y PRIORIDADES
  // ============================================

  const updateChargeStatus = async (chargeId: number, status: CalendarEventStatus): Promise<boolean> => {
    try {
      loading.value = true
      await CalendarService.updateChargeStatus({ charge_id: chargeId, status })
      // Recargar actividades para reflejar el cambio
      await getActivities()
      return true
    } catch (err: any) {
      error.value = err?.message || 'Error al actualizar estado'
      console.error('Error en updateChargeStatus:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const updateEventPriority = async (eventId: number, priority: CalendarEventPriority): Promise<boolean> => {
    if (!calendarPermissions.value.canEditPriority) {
      error.value = 'No tienes permisos para cambiar la prioridad'
      return false
    }
    try {
      loading.value = true
      await CalendarService.updateEventPriority({ event_id: eventId, priority })
      // Actualizar localmente
      const index = activities.value.findIndex(a => a.id === eventId)
      if (index !== -1) {
        activities.value[index].priority = priority
      }
      return true
    } catch (err: any) {
      error.value = err?.message || 'Error al actualizar prioridad'
      console.error('Error en updateEventPriority:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // NOTAS
  // ============================================

  const updateChargeNotes = async (chargeId: number, notes: string): Promise<boolean> => {
    try {
      loading.value = true
      await CalendarService.updateChargeNotes({ charge_id: chargeId, notes })
      // Recargar actividades
      await getActivities()
      return true
    } catch (err: any) {
      error.value = err?.message || 'Error al actualizar notas'
      console.error('Error en updateChargeNotes:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const updateEventNotes = async (eventId: number, notes: string): Promise<boolean> => {
    try {
      loading.value = true
      await CalendarService.updateEventNotes(eventId, notes)
      // Actualizar localmente
      const index = activities.value.findIndex(a => a.id === eventId)
      if (index !== -1) {
        activities.value[index].notes = notes
      }
      return true
    } catch (err: any) {
      error.value = err?.message || 'Error al actualizar notas'
      console.error('Error en updateEventNotes:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // RESPONSABLES
  // ============================================

  const loadResponsables = async () => {
    try {
      const data = await CalendarService.getResponsables()
      responsables.value = data
    } catch (err: any) {
      console.error('Error al cargar responsables:', err)
    }
  }

  const assignResponsable = async (eventId: number, userId: number): Promise<boolean> => {
    if (!calendarPermissions.value.canAssignResponsables) {
      error.value = 'No tienes permisos para asignar responsables'
      return false
    }
    try {
      loading.value = true
      await CalendarService.assignResponsable(eventId, userId)
      await getActivities()
      return true
    } catch (err: any) {
      error.value = err?.message || 'Error al asignar responsable'
      console.error('Error en assignResponsable:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const removeResponsable = async (eventId: number, userId: number): Promise<boolean> => {
    if (!calendarPermissions.value.canAssignResponsables) {
      error.value = 'No tienes permisos para remover responsables'
      return false
    }
    try {
      loading.value = true
      await CalendarService.removeResponsable(eventId, userId)
      await getActivities()
      return true
    } catch (err: any) {
      error.value = err?.message || 'Error al remover responsable'
      console.error('Error en removeResponsable:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // COLORES
  // ============================================

  const loadColorConfig = async () => {
    try {
      const data = await CalendarService.getColorConfig()
      colorConfig.value = data
    } catch (err: any) {
      console.error('Error al cargar configuración de colores:', err)
    }
  }

  const updateUserColor = async (userId: number, colorCode: string): Promise<boolean> => {
    try {
      loading.value = true
      await CalendarService.updateUserColor({ user_id: userId, color_code: colorCode })
      await loadColorConfig()
      return true
    } catch (err: any) {
      error.value = err?.message || 'Error al actualizar color'
      console.error('Error en updateUserColor:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // Obtener color de un responsable
  const getResponsableColor = (userId: number, nombre?: string): string => {
    // Primero buscar en la configuración de la BD
    const config = colorConfig.value.find(c => c.user_id === userId)
    if (config?.color_code) {
      return config.color_code
    }
    // Si no hay, usar color por defecto basado en el nombre
    if (nombre && DEFAULT_RESPONSABLE_COLORS[nombre]) {
      return DEFAULT_RESPONSABLE_COLORS[nombre]
    }
    // Color por defecto
    return '#6B7280'
  }

  // ============================================
  // CONTENEDORES
  // ============================================

  const loadContenedores = async () => {
    try {
      const data = await CalendarService.getContenedores()
      contenedores.value = data
    } catch (err: any) {
      console.error('Error al cargar contenedores:', err)
    }
  }

  // ============================================
  // CATÁLOGO DE ACTIVIDADES
  // ============================================

  const loadActivityCatalog = async () => {
    try {
      const data = await CalendarService.getActivityCatalog()
      activityCatalog.value = data
    } catch (err: any) {
      console.error('Error al cargar catálogo de actividades:', err)
    }
  }

  const createActivityInCatalog = async (name: string): Promise<{ id: number; name: string } | null> => {
    try {
      loading.value = true
      const activity = await CalendarService.createActivityCatalog(name)
      // Agregar a la lista local
      activityCatalog.value.push(activity)
      return activity
    } catch (err: any) {
      error.value = err?.message || 'Error al crear actividad en catálogo'
      console.error('Error en createActivityInCatalog:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const updateActivityInCatalog = async (id: number, name: string): Promise<{ id: number; name: string } | null> => {
    try {
      loading.value = true
      const activity = await CalendarService.updateActivityCatalog(id, name)
      // Actualizar en la lista local
      const index = activityCatalog.value.findIndex(a => a.id === id)
      if (index !== -1) {
        activityCatalog.value[index] = activity
      }
      return activity
    } catch (err: any) {
      error.value = err?.message || 'Error al actualizar actividad en catálogo'
      console.error('Error en updateActivityInCatalog:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const deleteActivityFromCatalog = async (id: number): Promise<boolean> => {
    try {
      loading.value = true
      await CalendarService.deleteActivityCatalog(id)
      // Remover de la lista local
      activityCatalog.value = activityCatalog.value.filter(a => a.id !== id)
      return true
    } catch (err: any) {
      error.value = err?.message || 'Error al eliminar actividad del catálogo'
      console.error('Error en deleteActivityFromCatalog:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // PROGRESO
  // ============================================

  const loadProgress = async () => {
    if (!calendarPermissions.value.canViewTeamProgress) {
      return
    }
    try {
      const data = await CalendarService.getProgress(filters.value)
      teamProgress.value = data.team
      responsableProgress.value = data.by_responsable
    } catch (err: any) {
      console.error('Error al cargar progreso:', err)
    }
  }

  // ============================================
  // FILTROS
  // ============================================

  const setFilter = <K extends keyof CalendarFilters>(key: K, value: CalendarFilters[K]) => {
    filters.value[key] = value
  }

  const clearFilters = () => {
    filters.value = {
      start_date: undefined,
      end_date: undefined,
      responsable_id: undefined,
      contenedor_id: undefined,
      status: undefined,
      priority: undefined
    }
  }

  const setDateRange = (startDate: string, endDate: string) => {
    filters.value.start_date = startDate
    filters.value.end_date = endDate
  }

  // ============================================
  // COMPUTED FILTERS
  // ============================================

  // Actividades filtradas para el usuario actual (Coordinación/Documentación)
  const myActivities = computed(() => {
    if (isJefeImportaciones.value) {
      return activities.value
    }
    // Filtrar solo las actividades donde el usuario actual es responsable
    return activities.value.filter(activity => {
      return activity.charges?.some(charge => charge.user_id === Number(currentId.value))
    })
  })

  // Actividades visibles según el rol
  const visibleActivities = computed(() => {
    if (calendarPermissions.value.canViewAllActivities) {
      return activities.value
    }
    return myActivities.value
  })

  // ============================================
  // INICIALIZACIÓN
  // ============================================

  const initialize = async () => {
    await Promise.all([
      loadResponsables(),
      loadContenedores(),
      loadColorConfig(),
      loadActivityCatalog()
    ])
  }

  // ============================================
  // HELPERS
  // ============================================

  // Calcular duración en días
  const calculateDuration = (startDate: string, endDate: string): number => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays + 1 // Incluir ambos días
  }

  // Formatear fecha para mostrar
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Verificar si el usuario puede editar el estado de un charge
  const canEditChargeStatus = (charge: any): boolean => {
    if (calendarPermissions.value.canEditAnyStatus) {
      return true
    }
    // Solo puede editar si es su propio charge
    return charge.user_id === Number(currentId.value)
  }

  return {
    // Estado
    activities,
    visibleActivities,
    myActivities,
    responsables,
    contenedores,
    colorConfig,
    activityCatalog,
    teamProgress,
    responsableProgress,
    loading,
    error,
    filters,
    currentUserId: currentId,

    // Permisos
    calendarPermissions,
    isJefeImportaciones,
    isCoordinacionOrDocumentacion,

    // Actividades
    getActivities,
    createActivity,
    updateActivity,
    deleteActivity,

    // Estados y prioridades
    updateChargeStatus,
    updateEventPriority,

    // Notas
    updateChargeNotes,
    updateEventNotes,

    // Responsables
    loadResponsables,
    assignResponsable,
    removeResponsable,

    // Colores
    loadColorConfig,
    updateUserColor,
    getResponsableColor,

    // Contenedores
    loadContenedores,

    // Catálogo de actividades
    loadActivityCatalog,
    createActivityInCatalog,
    updateActivityInCatalog,
    deleteActivityFromCatalog,

    // Progreso
    loadProgress,

    // Filtros
    setFilter,
    clearFilters,
    setDateRange,

    // Inicialización
    initialize,

    // Helpers
    calculateDuration,
    formatDate,
    canEditChargeStatus
  }
}
