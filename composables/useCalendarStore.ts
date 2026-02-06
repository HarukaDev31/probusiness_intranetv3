import { CalendarService } from "~/services/calendar/calendarService"
import type {
  CalendarEvent,
  CalendarFilters,
  CalendarPaginationMeta,
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
import { useSpinner } from '~/composables/commons/useSpinner'
import { useUserRole } from '~/composables/auth/useUserRole'
import { ROLES, getCalendarPermissions } from '~/constants/roles'
import { markCalendarActionByCurrentUser } from '~/config/websocket/events/calendar'
import { DEFAULT_RESPONSABLE_COLORS } from '~/constants/calendar'

const { withSpinner } = useSpinner()

// Colores por defecto para prioridades
const PRIORITY_COLORS: Record<number, string> = {
  0: '#22c55e', // Verde - Bajo
  1: '#f59e0b', // Amarillo - Medio
  2: '#ef4444'  // Rojo - Alto
}

// Estado global compartido (singleton)
const state = {
  // Datos principales
  events: ref<CalendarEvent[]>([]),
  responsables: ref<CalendarResponsable[]>([]),
  contenedores: ref<CalendarContenedor[]>([]),
  colorConfig: ref<CalendarUserColorConfig[]>([]),
  activityCatalog: ref<{ id: number; name: string }[]>([]),
  teamProgress: ref<TeamProgress | null>(null),
  responsableProgress: ref<ResponsableProgress[]>([]),
  
  // Estado de carga
  loading: ref(false),
  error: ref<string | null>(null),
  
  // Filtros activos
  filters: ref<CalendarFilters>({
    start_date: undefined,
    end_date: undefined,
    responsable_id: undefined,
    contenedor_id: undefined,
    contenedor_ids: undefined,
    status: undefined,
    priority: undefined
  }),
  
  /** Metadatos de paginación cuando getEvents se llama con page/per_page */
  eventsPagination: ref<CalendarPaginationMeta | null>(null),
  
  // Control de caché
  lastFetch: {
    events: ref<number>(0),
    responsables: ref<number>(0),
    contenedores: ref<number>(0),
    colorConfig: ref<number>(0),
    activityCatalog: ref<number>(0),
    progress: ref<number>(0)
  },
  
  // Tiempo de caché en ms (5 minutos)
  CACHE_TTL: 5 * 60 * 1000,
  
  // Flag para saber si ya se inicializó
  initialized: ref(false)
}

export const useCalendarStore = () => {
  const { currentRole, currentId } = useUserRole()

  // ============================================
  // HELPERS DE CACHÉ
  // ============================================
  
  const isCacheValid = (lastFetchTime: number): boolean => {
    return Date.now() - lastFetchTime < state.CACHE_TTL
  }

  const shouldRefetch = (key: keyof typeof state.lastFetch, force: boolean = false): boolean => {
    if (force) return true
    return !isCacheValid(state.lastFetch[key].value)
  }

  // ============================================
  // TRANSFORMACIÓN DE DATOS
  // ============================================

  const transformEvent = (event: CalendarEvent): CalendarEvent => {
    const title = event.name || event.title || 'Sin título'
    
    let color = '#3b82f6'
    if (event.charges && event.charges.length > 0) {
      const firstCharge = event.charges[0]
      const userColorConfig = state.colorConfig.value.find(c => c.user_id === firstCharge.user_id)
      if (userColorConfig) {
        color = userColorConfig.color_code
      } else if (firstCharge.user?.color) {
        color = firstCharge.user.color
      } else if (firstCharge.user?.nombre && DEFAULT_RESPONSABLE_COLORS[firstCharge.user.nombre]) {
        color = DEFAULT_RESPONSABLE_COLORS[firstCharge.user.nombre]
      }
    } else {
      color = PRIORITY_COLORS[event.priority] || color
    }

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

  // ============================================
  // PERMISOS
  // ============================================

  const calendarPermissions = computed(() => {
    return getCalendarPermissions(currentRole.value as any)
  })

  const isJefeImportaciones = computed(() => {
    return currentRole.value === ROLES.JEFE_IMPORTACIONES
  })

  const isCoordinacionOrDocumentacion = computed(() => {
    return currentRole.value === ROLES.COORDINACION || currentRole.value === ROLES.DOCUMENTACION
  })

  // ============================================
  // EVENTOS / ACTIVIDADES
  // ============================================

  const getEvents = async (filters?: CalendarFilters, force: boolean = false) => {
    // Si los filtros son los mismos y el caché es válido, no recargar
    const filtersKey = JSON.stringify({ ...state.filters.value, ...filters })
    const lastFiltersKey = (state as any)._lastFiltersKey
    
    if (!force && lastFiltersKey === filtersKey && isCacheValid(state.lastFetch.events.value)) {
      return state.events.value
    }
    
    try {
      state.loading.value = true
      state.error.value = null
      const appliedFilters = { ...state.filters.value, ...filters }
      const response = await CalendarService.getEvents(appliedFilters)
      state.events.value = (response.data || []).map(transformEvent)
      if (response.meta) {
        state.eventsPagination.value = response.meta
      } else if (appliedFilters.page === undefined && appliedFilters.per_page === undefined) {
        state.eventsPagination.value = null
      }
      state.lastFetch.events.value = Date.now()
      ;(state as any)._lastFiltersKey = filtersKey
      return state.events.value
    } catch (err: any) {
      state.error.value = err?.message || 'Error al cargar eventos'
      console.error('Error en getEvents:', err)
      return []
    } finally {
      state.loading.value = false
    }
  }

  const createActivity = async (data: CreateCalendarEventRequest): Promise<CalendarEvent | null> => {
    try {
      state.loading.value = true
      state.error.value = null
      const activity = await withSpinner(
        () => CalendarService.createActivity(data),
        'Creando actividad...'
      )
      // No hacer push aquí: el caller hace loadEvents/loadActivitiesData y reemplaza la lista.
      // Evita duplicados cuando se recarga justo después de crear.
      return activity
    } catch (err: any) {
      state.error.value = err?.message || 'Error al crear actividad'
      console.error('Error en createActivity:', err)
      return null
    } finally {
      state.loading.value = false
    }
  }

  const updateActivity = async (data: UpdateCalendarEventRequest): Promise<CalendarEvent | null> => {
    try {
      state.loading.value = true
      state.error.value = null
      const activity = await withSpinner(
        () => CalendarService.updateActivity(data),
        'Actualizando actividad...'
      )
      if (activity) {
        // Actualizar en la lista local
        const index = state.events.value.findIndex(e => e.id === data.id)
        if (index !== -1) {
          state.events.value[index] = transformEvent(activity)
        }
      }
      return activity
    } catch (err: any) {
      state.error.value = err?.message || 'Error al actualizar actividad'
      console.error('Error en updateActivity:', err)
      return null
    } finally {
      state.loading.value = false
    }
  }

  const deleteActivity = async (id: number): Promise<boolean> => {
    try {
      state.loading.value = true
      state.error.value = null
      await withSpinner(
        () => CalendarService.deleteActivity(id),
        'Eliminando actividad...'
      )
      // Remover de la lista local
      state.events.value = state.events.value.filter(e => e.id !== id)
      return true
    } catch (err: any) {
      state.error.value = err?.message || 'Error al eliminar actividad'
      console.error('Error en deleteActivity:', err)
      return false
    } finally {
      state.loading.value = false
    }
  }

  // ============================================
  // RESPONSABLES
  // ============================================

  const loadResponsables = async (force: boolean = false) => {
    if (!shouldRefetch('responsables', force) && state.responsables.value.length > 0) {
      return state.responsables.value
    }
    
    try {
      const data = await CalendarService.getResponsables()
      state.responsables.value = data
      state.lastFetch.responsables.value = Date.now()
      return data
    } catch (err: any) {
      console.error('Error al cargar responsables:', err)
      return []
    }
  }

  // ============================================
  // CONTENEDORES
  // ============================================

  const loadContenedores = async (force: boolean = false) => {
    if (!shouldRefetch('contenedores', force) && state.contenedores.value.length > 0) {
      return state.contenedores.value
    }
    
    try {
      const data = await CalendarService.getContenedores()
      state.contenedores.value = data
      state.lastFetch.contenedores.value = Date.now()
      return data
    } catch (err: any) {
      console.error('Error al cargar contenedores:', err)
      return []
    }
  }

  // ============================================
  // COLORES
  // ============================================

  const loadColorConfig = async (force: boolean = false) => {
    if (!shouldRefetch('colorConfig', force) && state.colorConfig.value.length > 0) {
      return state.colorConfig.value
    }
    
    try {
      const data = await CalendarService.getColorConfig()
      state.colorConfig.value = data
      state.lastFetch.colorConfig.value = Date.now()
      return data
    } catch (err: any) {
      console.error('Error al cargar configuración de colores:', err)
      return []
    }
  }

  const updateUserColor = async (userId: number, colorCode: string): Promise<boolean> => {
    try {
      state.loading.value = true
      await CalendarService.updateUserColor({ user_id: userId, color_code: colorCode })
      // Actualizar en la lista local
      const index = state.colorConfig.value.findIndex(c => c.user_id === userId)
      if (index !== -1) {
        state.colorConfig.value[index].color_code = colorCode
      } else {
        state.colorConfig.value.push({ user_id: userId, color_code: colorCode } as CalendarUserColorConfig)
      }
      return true
    } catch (err: any) {
      state.error.value = err?.message || 'Error al actualizar color'
      console.error('Error en updateUserColor:', err)
      return false
    } finally {
      state.loading.value = false
    }
  }

  const getResponsableColor = (userId: number, nombre?: string): string => {
    const config = state.colorConfig.value.find(c => c.user_id === userId)
    if (config?.color_code) {
      return config.color_code
    }
    if (nombre && DEFAULT_RESPONSABLE_COLORS[nombre]) {
      return DEFAULT_RESPONSABLE_COLORS[nombre]
    }
    return '#6B7280'
  }

  // ============================================
  // CATÁLOGO DE ACTIVIDADES
  // ============================================

  const loadActivityCatalog = async (force: boolean = false) => {
    if (!shouldRefetch('activityCatalog', force) && state.activityCatalog.value.length > 0) {
      return state.activityCatalog.value
    }
    
    try {
      const data = await CalendarService.getActivityCatalog()
      state.activityCatalog.value = data
      state.lastFetch.activityCatalog.value = Date.now()
      return data
    } catch (err: any) {
      console.error('Error al cargar catálogo de actividades:', err)
      return []
    }
  }

  const createActivityInCatalog = async (name: string): Promise<{ id: number; name: string } | null> => {
    try {
      state.loading.value = true
      const activity = await CalendarService.createActivityCatalog(name)
      state.activityCatalog.value.push(activity)
      return activity
    } catch (err: any) {
      state.error.value = err?.message || 'Error al crear actividad en catálogo'
      console.error('Error en createActivityInCatalog:', err)
      return null
    } finally {
      state.loading.value = false
    }
  }

  const deleteActivityFromCatalog = async (catalogId: number): Promise<boolean> => {
    try {
      await CalendarService.deleteActivityCatalog(catalogId)
      state.activityCatalog.value = state.activityCatalog.value.filter(a => a.id !== catalogId)
      state.lastFetch.activityCatalog.value = 0
      return true
    } catch (err: any) {
      state.error.value = err?.message || 'Error al eliminar del catálogo'
      console.error('Error en deleteActivityFromCatalog:', err)
      return false
    }
  }

  // ============================================
  // PROGRESO
  // ============================================

  const loadProgress = async (force: boolean = false) => {
    if (!calendarPermissions.value.canViewTeamProgress) {
      return
    }
    
    if (!shouldRefetch('progress', force) && state.teamProgress.value) {
      return { team: state.teamProgress.value, by_responsable: state.responsableProgress.value }
    }
    
    try {
      const data = await CalendarService.getProgress(state.filters.value)
      state.teamProgress.value = data.team
      state.responsableProgress.value = data.by_responsable
      state.lastFetch.progress.value = Date.now()
      return data
    } catch (err: any) {
      console.error('Error al cargar progreso:', err)
      return null
    }
  }

  // ============================================
  // TRACKING / HISTORIAL
  // ============================================

  /**
   * Obtener historial de cambios de estado de un charge específico
   */
  const getChargeTracking = async (chargeId: number) => {
    try {
      state.loading.value = true
      const data = await CalendarService.getChargeTracking(chargeId)
      return data
    } catch (err: any) {
      state.error.value = err?.message || 'Error al obtener tracking'
      console.error('Error en getChargeTracking:', err)
      return []
    } finally {
      state.loading.value = false
    }
  }

  /**
   * Obtener historial de cambios de estado de una actividad completa
   * (todos los charges de esa actividad)
   */
  const getActivityTracking = async (activityId: number) => {
    try {
      state.loading.value = true
      const data = await CalendarService.getActivityTracking(activityId)
      return data
    } catch (err: any) {
      state.error.value = err?.message || 'Error al obtener tracking de actividad'
      console.error('Error en getActivityTracking:', err)
      return []
    } finally {
      state.loading.value = false
    }
  }

  // ============================================
  // ESTADOS Y PRIORIDADES
  // ============================================

  const updateChargeStatus = async (chargeId: number, status: CalendarEventStatus): Promise<boolean> => {
    try {
      state.loading.value = true
      await CalendarService.updateChargeStatus({ charge_id: chargeId, status })
      // Actualizar en la lista local
      for (const event of state.events.value) {
        const charge = event.charges?.find(c => c.id === chargeId)
        if (charge) {
          charge.status = status
          break
        }
      }
      return true
    } catch (err: any) {
      state.error.value = err?.message || 'Error al actualizar estado'
      console.error('Error en updateChargeStatus:', err)
      return false
    } finally {
      state.loading.value = false
    }
  }

  const updateEventPriority = async (eventId: number, priority: CalendarEventPriority): Promise<boolean> => {
    try {
      state.loading.value = true
      await CalendarService.updateEventPriority({ event_id: eventId, priority })
      // Actualizar en la lista local
      const event = state.events.value.find(e => e.id === eventId)
      if (event) {
        event.priority = priority
      }
      return true
    } catch (err: any) {
      state.error.value = err?.message || 'Error al actualizar prioridad'
      console.error('Error en updateEventPriority:', err)
      return false
    } finally {
      state.loading.value = false
    }
  }

  // ============================================
  // NOTAS
  // ============================================

  const updateChargeNotes = async (chargeId: number, notes: string): Promise<boolean> => {
    try {
      state.loading.value = true
      await CalendarService.updateChargeNotes({ charge_id: chargeId, notes })
      // Actualizar en la lista local
      for (const event of state.events.value) {
        const charge = event.charges?.find(c => c.id === chargeId)
        if (charge) {
          charge.notes = notes
          break
        }
      }
      return true
    } catch (err: any) {
      state.error.value = err?.message || 'Error al actualizar notas'
      console.error('Error en updateChargeNotes:', err)
      return false
    } finally {
      state.loading.value = false
    }
  }

  const updateEventNotes = async (eventId: number, notes: string): Promise<boolean> => {
    try {
      state.loading.value = true
      await CalendarService.updateEventNotes(eventId, notes)
      // Actualizar en la lista local
      const event = state.events.value.find(e => e.id === eventId)
      if (event) {
        event.notes = notes
      }
      return true
    } catch (err: any) {
      state.error.value = err?.message || 'Error al actualizar notas'
      console.error('Error en updateEventNotes:', err)
      return false
    } finally {
      state.loading.value = false
    }
  }

  // ============================================
  // FILTROS
  // ============================================

  const setFilter = <K extends keyof CalendarFilters>(key: K, value: CalendarFilters[K]) => {
    state.filters.value[key] = value
  }

  const clearFilters = () => {
    state.filters.value = {
      start_date: undefined,
      end_date: undefined,
      responsable_id: undefined,
      contenedor_id: undefined,
      contenedor_ids: undefined,
      status: undefined,
      priority: undefined
    }
  }

  const setDateRange = (startDate: string, endDate: string) => {
    state.filters.value.start_date = startDate
    state.filters.value.end_date = endDate
  }

  // ============================================
  // COMPUTED
  // ============================================

  const visibleEvents = computed(() => {
    let list = state.events.value.filter(event => {
      if (event.charges && event.charges.length > 0) {
        const isAssigned = event.charges.some(charge => charge.user_id === Number(currentId.value))
        if (isAssigned) return true
      }
      if (event.is_public) return true
      if (event.is_for_me && event.created_by === Number(currentId.value)) return true
      if (event.role_name && event.role_name === currentRole.value) return true
      if (event.created_by === Number(currentId.value)) return true
      
      const hasLegacyFields = event.is_public !== undefined || 
                              event.is_for_me !== undefined || 
                              event.role_name !== undefined || 
                              event.created_by !== undefined
      if (!hasLegacyFields) return true
      
      return false
    })
    const responsableId = state.filters.value.responsable_id
    if (responsableId != null && typeof responsableId === 'number') {
      list = list.filter(event =>
        event.charges?.some(charge => charge.user_id === responsableId) ?? false
      )
    }
    return list
  })

  const myActivities = computed(() => {
    if (isJefeImportaciones.value) {
      return state.events.value
    }
    return state.events.value.filter(activity => {
      return activity.charges?.some(charge => charge.user_id === Number(currentId.value))
    })
  })

  const visibleActivities = computed(() => {
    let list = calendarPermissions.value.canViewAllActivities
      ? state.events.value
      : myActivities.value
    const responsableId = state.filters.value.responsable_id
    if (responsableId != null && typeof responsableId === 'number') {
      list = list.filter(activity =>
        activity.charges?.some(charge => charge.user_id === responsableId) ?? false
      )
    }
    return list
  })

  // ============================================
  // UTILIDADES PARA EVENTOS MULTI-DÍA
  // ============================================

  const getEventColors = (event: CalendarEvent, options?: { usePriority?: boolean }): string[] => {
    // Evento completado (todos los responsables en COMPLETADO) → gris
    const charges = event.charges || []
    if (charges.length > 0 && charges.every((c: { status?: string }) => c.status === 'COMPLETADO')) {
      return ['#9ca3af']
    }
    if (options?.usePriority) {
      return [PRIORITY_COLORS[event.priority] ?? '#3b82f6']
    }
    if (charges.length === 0) {
      return [PRIORITY_COLORS[event.priority] || '#3b82f6']
    }
    return charges.map(charge => {
      const config = state.colorConfig.value.find(c => c.user_id === charge.user_id)
      if (config?.color_code) return config.color_code
      if (charge.user?.color) return charge.user.color
      if (charge.user?.nombre && DEFAULT_RESPONSABLE_COLORS[charge.user.nombre]) {
        return DEFAULT_RESPONSABLE_COLORS[charge.user.nombre]
      }
      return '#6B7280'
    })
  }

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

  const isEventOnDate = (event: CalendarEvent, dateStr: string): boolean => {
    const startDate = event.start_date
    const endDate = event.end_date
    if (!startDate || !endDate) return false
    return dateStr >= startDate && dateStr <= endDate
  }

  // ============================================
  // FUNCIONES LEGACY (compatibilidad)
  // ============================================

  const createEvent = async (data: any): Promise<CalendarEvent | null> => {
    try {
      state.loading.value = true
      state.error.value = null
      const event = await withSpinner(
        () => CalendarService.createEvent(data),
        'Creando evento...'
      )
      if (event) {
        const transformed = transformEvent(event)
        state.events.value.push(transformed)
        markCalendarActionByCurrentUser()
      }
      return event
    } catch (err: any) {
      state.error.value = err?.message || 'Error al crear evento'
      console.error('Error en createEvent:', err)
      return null
    } finally {
      state.loading.value = false
    }
  }

  const updateEvent = async (data: any): Promise<CalendarEvent | null> => {
    try {
      state.loading.value = true
      state.error.value = null
      const event = await withSpinner(
        () => CalendarService.updateEvent(data),
        'Actualizando evento...'
      )
      if (event) {
        const index = state.events.value.findIndex(e => e.id === data.id)
        if (index !== -1) {
          state.events.value[index] = transformEvent(event)
        }
        markCalendarActionByCurrentUser()
      }
      return event
    } catch (err: any) {
      state.error.value = err?.message || 'Error al actualizar evento'
      console.error('Error en updateEvent:', err)
      return null
    } finally {
      state.loading.value = false
    }
  }

  const deleteEvent = async (id: number, taskDayId?: number | null): Promise<boolean> => {
    try {
      state.loading.value = true
      state.error.value = null
      await withSpinner(
        () => CalendarService.deleteEvent(id, taskDayId),
        'Eliminando evento...'
      )
      if (taskDayId) {
        // Eliminar solo el día de la tarea
        const event = state.events.value.find(e => e.task_day_id === taskDayId)
        if (event) {
          state.events.value = state.events.value.filter(e => e.task_day_id !== taskDayId)
        }
      } else {
        state.events.value = state.events.value.filter(e => e.id !== id)
      }
      markCalendarActionByCurrentUser()
      return true
    } catch (err: any) {
      state.error.value = err?.message || 'Error al eliminar evento'
      console.error('Error en deleteEvent:', err)
      return false
    } finally {
      state.loading.value = false
    }
  }

  // ============================================
  // INICIALIZACIÓN
  // ============================================

  const initialize = async (force: boolean = false) => {
    if (state.initialized.value && !force) {
      return
    }

    state.loading.value = true
    try {
      await Promise.all([
        loadResponsables(force),
        loadContenedores(force),
        loadColorConfig(force),
        loadActivityCatalog(force)
      ])
      state.initialized.value = true
    } finally {
      state.loading.value = false
    }
  }

  // Invalidar caché (forzar recarga en la próxima petición)
  const invalidateCache = (key?: keyof typeof state.lastFetch) => {
    if (key) {
      state.lastFetch[key].value = 0
    } else {
      // Invalidar todo
      Object.keys(state.lastFetch).forEach(k => {
        (state.lastFetch as any)[k].value = 0
      })
    }
  }

  // Refrescar todos los datos
  const refresh = async () => {
    invalidateCache()
    await initialize(true)
    await getEvents(state.filters.value, true)
  }

  return {
    // Estado (readonly)
    events: computed(() => state.events.value),
    visibleEvents,
    visibleActivities,
    myActivities,
    responsables: computed(() => state.responsables.value),
    contenedores: computed(() => state.contenedores.value),
    colorConfig: computed(() => state.colorConfig.value),
    activityCatalog: computed(() => state.activityCatalog.value),
    teamProgress: computed(() => state.teamProgress.value),
    responsableProgress: computed(() => state.responsableProgress.value),
    loading: computed(() => state.loading.value),
    error: computed(() => state.error.value),
    filters: computed(() => state.filters.value),
    eventsPagination: computed(() => state.eventsPagination.value),
    initialized: computed(() => state.initialized.value),
    currentUserId: currentId,

    // Permisos
    calendarPermissions,
    isJefeImportaciones,
    isCoordinacionOrDocumentacion,

    // Eventos / Actividades
    getEvents,
    createActivity,
    updateActivity,
    deleteActivity,
    
    // Legacy (compatibilidad)
    createEvent,
    updateEvent,
    deleteEvent,

    // Estados y prioridades
    updateChargeStatus,
    updateEventPriority,

    // Notas
    updateChargeNotes,
    updateEventNotes,

    // Responsables
    loadResponsables,

    // Colores
    loadColorConfig,
    updateUserColor,
    getResponsableColor,

    // Contenedores
    loadContenedores,

    // Catálogo de actividades
    loadActivityCatalog,
    createActivityInCatalog,
    deleteActivityFromCatalog,

    // Progreso
    loadProgress,

    // Tracking / Historial
    getChargeTracking,
    getActivityTracking,

    // Filtros
    setFilter,
    clearFilters,
    setDateRange,

    // Utilidades para eventos multi-día
    getEventColors,
    getEventPosition,
    isEventOnDate,

    // Inicialización y caché
    initialize,
    invalidateCache,
    refresh
  }
}
