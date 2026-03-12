import { CalendarService, type CalendarRoleGroup } from "~/services/calendar/calendarService"
import type {
  CalendarEvent,
  CalendarFilters,
  CalendarPaginationMeta,
  CalendarResponsable,
  CalendarContenedor,
  CalendarUserColorConfig,
  CalendarConsolidadoColorConfig,
  CalendarActivityCatalogItem,
  CalendarEventStatus,
  CalendarEventPriority,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
  TeamProgress,
  ResponsableProgress
} from "~/types/calendar"
import { useSpinner } from '~/composables/commons/useSpinner'
import { useUserRole } from '~/composables/auth/useUserRole'
import type { CalendarConfigResponse } from '~/services/calendar/calendarService'
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
  consolidadoColorConfig: ref<CalendarConsolidadoColorConfig[]>([]),
  activityCatalog: ref<CalendarActivityCatalogItem[]>([]),
  teamProgress: ref<TeamProgress | null>(null),
  responsableProgress: ref<ResponsableProgress[]>([]),
  myProgressStats: ref<{ total: number; completadas: number; en_progreso: number; pendientes: number } | null>(null),
  
  // Estado de carga
  loading: ref(false),
  error: ref<string | null>(null),
  
  // Filtros activos
  filters: ref<CalendarFilters>({
    start_date: undefined,
    end_date: undefined,
    responsable_id: undefined,
    responsable_ids: undefined,
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
    consolidadoColorConfig: ref<number>(0),
    activityCatalog: ref<number>(0),
    progress: ref<number>(0)
  },
  
  // Tiempo de caché en ms (5 minutos)
  CACHE_TTL: 5 * 60 * 1000,
  
  // Flag para saber si ya se inicializó
  initialized: ref(false),

  // Configuración de calendario (permisos, rol, colores) — compartida entre todas las vistas
  calendarConfig: ref<CalendarConfigResponse['data'] | null>(null),

  // Id del grupo de calendario activo (para usuarios en varios grupos). Se envía en todas las peticiones y se sincroniza con la URL.
  currentRoleGroupId: ref<number | null>(null),

  // Grupos de calendario del usuario (para selector de calendarios en index.vue)
  myRoleGroups: ref<CalendarRoleGroup[]>([])
}

export const useCalendarStore = () => {
  const { currentRole, currentId } = useUserRole()
  const route = useRoute()

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

    // Misma prioridad que getEventColors: actividad > consolidado > prioridad (solo para .color del evento)
    let color = PRIORITY_COLORS[event.priority] || '#3b82f6'
    const activityId = event.activity_id != null ? Number(event.activity_id) : null
    if (activityId != null && !Number.isNaN(activityId)) {
      const catalogItem = state.activityCatalog.value.find(a => Number(a.id) === activityId)
      if (catalogItem?.color_code && String(catalogItem.color_code).trim()) {
        color = String(catalogItem.color_code).trim()
      }
    }
    if (color === (PRIORITY_COLORS[event.priority] || '#3b82f6') && event.contenedor_id) {
      const consolidadoConfig = state.consolidadoColorConfig.value.find(c => c.contenedor_id === event.contenedor_id)
      if (consolidadoConfig) color = consolidadoConfig.color_code
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
  // PERMISOS Y CONFIGURACIÓN (desde backend)
  // ============================================

  const calendarConfig = state.calendarConfig

  const calendarPermissions = computed(() => {
    return calendarConfig.value?.permissions ?? {}
  })

  const isJefeImportaciones = computed(() => {
    return calendarConfig.value?.role_group?.role_type === 'JEFE'
  })

  const isCoordinacionOrDocumentacion = computed(() => {
    const roleType = calendarConfig.value?.role_group?.role_type
    // En el nuevo esquema de grupos de calendario solo hay JEFE o MIEMBRO.
    // Ambos se consideran parte del equipo para efectos de filtros/vistas.
    return roleType === 'JEFE' || roleType === 'MIEMBRO'
  })

  const usaConsolidado = computed(() => {
    return calendarConfig.value?.usa_consolidado ?? true
  })

  const defaultJefeOrder = ['ACTIVIDAD', 'CONSOLIDADO', 'USUARIO', 'PRIORIDAD', 'COMPLETADO']
  const defaultMiembroOrder = ['USUARIO', 'PRIORIDAD', 'ACTIVIDAD', 'CONSOLIDADO', 'COMPLETADO']

  /** Orden guardado en role-groups para el jefe; solo usa default si la API no devuelve array con elementos. */
  const jefeColorOrder = computed(() => {
    const raw = calendarConfig.value?.color_priority_order?.jefe
    if (Array.isArray(raw) && raw.length > 0) return raw
    return defaultJefeOrder
  })
  /** Orden guardado en role-groups para el miembro; solo usa default si la API no devuelve array con elementos. */
  const miembroColorOrder = computed(() => {
    const raw = calendarConfig.value?.color_priority_order?.miembro
    if (Array.isArray(raw) && raw.length > 0) return raw
    return defaultMiembroOrder
  })

  /** Orden de prioridad de colores según el rol del usuario en el grupo actual (el de la config). */
  const effectiveColorOrder = computed(() => {
    const roleType = calendarConfig.value?.role_group?.role_type
    if (roleType === 'JEFE') return jefeColorOrder.value
    return miembroColorOrder.value
  })

  const showEventDetails = computed(() => {
    return calendarConfig.value?.show_event_details ?? false
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
      const appliedFilters: CalendarFilters = {
        ...state.filters.value,
        ...filters,
        role_group_id: state.currentRoleGroupId.value ?? undefined
      }
      const response = await CalendarService.getEvents(appliedFilters)
      state.events.value = (response.data || []).map(transformEvent)
      if (response.meta) {
        state.eventsPagination.value = response.meta
      } else if (appliedFilters.page === undefined && appliedFilters.per_page === undefined) {
        state.eventsPagination.value = null
      }
      if ((response as any).my_progress) {
        state.myProgressStats.value = (response as any).my_progress
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
  // GRUPOS DEL USUARIO (selector de calendarios)
  // ============================================

  const loadMyRoleGroups = async (): Promise<CalendarRoleGroup[]> => {
    try {
      const groups = await CalendarService.getMyRoleGroups()
      const jefeGroups = groups.filter((g: CalendarRoleGroup) => g.role_type === 'JEFE')
      state.myRoleGroups.value = jefeGroups
      // Si no hay grupo activo pero sí grupos donde es jefe, seleccionar el primero por defecto
      if (state.currentRoleGroupId.value == null && jefeGroups.length > 0) {
        state.currentRoleGroupId.value = jefeGroups[0].id
      }
      return jefeGroups
    } catch (err) {
      console.error('Error al cargar grupos de calendario del usuario:', err)
      state.myRoleGroups.value = []
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
    const hex = colorCode.startsWith('#') ? colorCode : `#${colorCode}`
    try {
      state.loading.value = true
      await CalendarService.updateUserColor({ user_id: userId, color_code: hex })
      const index = state.colorConfig.value.findIndex(c => c.user_id === userId)
      if (index !== -1) {
        state.colorConfig.value[index].color_code = hex
      } else {
        state.colorConfig.value.push({ user_id: userId, color_code: hex } as CalendarUserColorConfig)
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

  const loadConsolidadoColorConfig = async (force: boolean = false) => {
    if (!shouldRefetch('consolidadoColorConfig', force) && state.consolidadoColorConfig.value.length > 0) {
      return state.consolidadoColorConfig.value
    }
    try {
      const data = await CalendarService.getConsolidadoColorConfig()
      state.consolidadoColorConfig.value = data
      state.lastFetch.consolidadoColorConfig.value = Date.now()
      return data
    } catch (err: any) {
      console.error('Error al cargar colores de consolidados:', err)
      return []
    }
  }

  /** Guarda múltiples colores de consolidados en una sola petición */
  const updateConsolidadoColors = async (items: Array<{ contenedorId: number; colorCode: string }>): Promise<boolean> => {
    try {
      state.loading.value = true
      await CalendarService.updateConsolidadoColors(
        items.map(i => ({ contenedor_id: i.contenedorId, color_code: i.colorCode }))
      )
      const next = [...state.consolidadoColorConfig.value]
      for (const { contenedorId, colorCode } of items) {
        const index = next.findIndex(c => c.contenedor_id === contenedorId)
        if (index !== -1) {
          next[index] = { ...next[index], color_code: colorCode }
        } else {
          next.push({ contenedor_id: contenedorId, color_code: colorCode } as CalendarConsolidadoColorConfig)
        }
      }
      state.consolidadoColorConfig.value = next
      return true
    } catch (err: any) {
      state.error.value = err?.message || 'Error al actualizar colores de consolidados'
      console.error('Error en updateConsolidadoColors:', err)
      return false
    } finally {
      state.loading.value = false
    }
  }

  const updateConsolidadoColor = async (contenedorId: number, colorCode: string): Promise<boolean> => {
    return updateConsolidadoColors([{ contenedorId, colorCode }])
  }

  const getConsolidadoColor = (contenedorId: number): string => {
    const config = state.consolidadoColorConfig.value.find(c => c.contenedor_id === contenedorId)
    return config?.color_code ?? '#6B7280'
  }

  // ============================================
  // CATÁLOGO DE ACTIVIDADES
  // ============================================

  const loadActivityCatalog = async (force: boolean = false) => {
    const roleGroupId = state.currentRoleGroupId.value
    if (roleGroupId == null) {
      state.activityCatalog.value = []
      return []
    }
    if (!shouldRefetch('activityCatalog', force) && state.activityCatalog.value.length > 0) {
      return state.activityCatalog.value
    }

    try {
      const data = await CalendarService.getActivityCatalog(roleGroupId)
      state.activityCatalog.value = data
      state.lastFetch.activityCatalog.value = Date.now()
      return data
    } catch (err: any) {
      console.error('Error al cargar catálogo de actividades:', err)
      return []
    }
  }

  const createActivityInCatalog = async (name: string): Promise<CalendarActivityCatalogItem | null> => {
    const roleGroupId = state.currentRoleGroupId.value
    if (roleGroupId == null) {
      state.error.value = 'No hay grupo de calendario seleccionado'
      return null
    }
    try {
      state.loading.value = true
      const activity = await CalendarService.createActivityCatalog(name, roleGroupId)
      state.activityCatalog.value = [...state.activityCatalog.value, activity]
      return activity
    } catch (err: any) {
      state.error.value = err?.message || 'Error al crear actividad en catálogo'
      console.error('Error en createActivityInCatalog:', err)
      return null
    } finally {
      state.loading.value = false
    }
  }

  const updateActivityInCatalog = async (
    id: number,
    name: string,
    colorCode?: string | null,
    extras?: { allow_saturday?: boolean; allow_sunday?: boolean; default_priority?: number }
  ): Promise<boolean> => {
    const roleGroupId = state.currentRoleGroupId.value
    if (roleGroupId == null) {
      state.error.value = 'No hay grupo de calendario seleccionado'
      return false
    }
    try {
      state.loading.value = true
      const updated = await CalendarService.updateActivityCatalog(id, name, colorCode, extras, roleGroupId)
      const index = state.activityCatalog.value.findIndex(a => a.id === id)
      if (index !== -1) {
        state.activityCatalog.value[index] = updated
      }
      // Re-aplicar color a eventos que usan esta actividad para que el calendario se actualice sin editar
      const activityIdNum = Number(id)
      const hasAffectedEvents = state.events.value.some(
        ev => ev.activity_id != null && Number(ev.activity_id) === activityIdNum
      )
      if (hasAffectedEvents) {
        state.events.value = state.events.value.map(ev => {
          const evActivityId = ev.activity_id != null ? Number(ev.activity_id) : null
          if (evActivityId === activityIdNum) return transformEvent(ev)
          return ev
        })
      }
      return true
    } catch (err: any) {
      state.error.value = err?.message || 'Error al actualizar actividad del catálogo'
      console.error('Error en updateActivityInCatalog:', err)
      return false
    } finally {
      state.loading.value = false
    }
  }

  const reorderActivityCatalog = async (ids: number[]): Promise<boolean> => {
    const roleGroupId = state.currentRoleGroupId.value
    if (roleGroupId == null) {
      state.error.value = 'No hay grupo de calendario seleccionado'
      return false
    }
    try {
      await CalendarService.reorderActivityCatalog(ids, roleGroupId)
      // Reordenar localmente para reflejar el cambio sin recarga
      const sorted = ids
        .map(id => state.activityCatalog.value.find(a => a.id === id))
        .filter(Boolean) as CalendarActivityCatalogItem[]
      state.activityCatalog.value = sorted
      return true
    } catch (err: any) {
      state.error.value = err?.message || 'Error al reordenar catálogo'
      console.error('Error en reorderActivityCatalog:', err)
      return false
    }
  }

  const deleteActivityFromCatalog = async (catalogId: number): Promise<boolean> => {
    const roleGroupId = state.currentRoleGroupId.value
    if (roleGroupId == null) {
      state.error.value = 'No hay grupo de calendario seleccionado'
      return false
    }
    try {
      await CalendarService.deleteActivityCatalog(catalogId, roleGroupId)
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

  const loadProgress = async (filters?: CalendarFilters, force: boolean = false) => {
    if (!calendarPermissions.value.canViewTeamProgress) {
      return
    }

    // Si se pasan filtros explícitos siempre refresca (ignorar caché)
    const hasExplicitFilters = filters && Object.keys(filters).some(k => (filters as any)[k] !== undefined)
    if (!hasExplicitFilters && !shouldRefetch('progress', force) && state.teamProgress.value) {
      return { team: state.teamProgress.value, by_responsable: state.responsableProgress.value }
    }

    try {
      const baseFilters = hasExplicitFilters ? filters! : state.filters.value
      const appliedFilters = { ...baseFilters, role_group_id: state.currentRoleGroupId.value ?? undefined }
      const data = await CalendarService.getProgress(appliedFilters)
      state.teamProgress.value = data.team
      state.responsableProgress.value = data.by_responsable
      if (!hasExplicitFilters) {
        state.lastFetch.progress.value = Date.now()
      }
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

  /** Estado por actividad: actualiza todos los charges del evento; cualquier participante puede cambiarlo */
  const updateEventStatus = async (eventId: number, status: CalendarEventStatus): Promise<boolean> => {
    try {
      state.loading.value = true
      const response = await CalendarService.updateEventStatus({ event_id: eventId, status })
      // Actualizar en la lista local (todos los charges del evento)
      const event = state.events.value.find(e => e.id === eventId)
      if (event?.charges) {
        event.charges.forEach(c => { c.status = status })
      }
      if (response?.data) {
        const idx = state.events.value.findIndex(e => e.id === eventId)
        if (idx !== -1) state.events.value[idx] = response.data
      }
      return true
    } catch (err: any) {
      state.error.value = err?.message || 'Error al actualizar estado'
      console.error('Error en updateEventStatus:', err)
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
      responsable_ids: undefined,
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
    const responsableIds = state.filters.value.responsable_ids
    const responsableId = state.filters.value.responsable_id
    const idSet = responsableIds?.length ? new Set(responsableIds) : null
    const currentIdNum = Number(currentId.value)

    return state.events.value.filter(event => {
      // Verificar visibilidad del evento (acceso del usuario actual)
      let visible = false
      if (event.charges && event.charges.length > 0) {
        if (event.charges.some(charge => charge.user_id === currentIdNum)) visible = true
      } else {
        // Sin responsables: visible para todos los del grupo (el backend ya filtró por grupo)
        visible = true
      }
      if (!visible) {
        if (event.is_public) visible = true
        else if (event.is_for_me && event.created_by === currentIdNum) visible = true
        else if (event.role_name && event.role_name === currentRole.value) visible = true
        else if (event.created_by === currentIdNum) visible = true
        else {
          const hasLegacyFields = event.is_public !== undefined ||
            event.is_for_me !== undefined ||
            event.role_name !== undefined ||
            event.created_by !== undefined
          if (!hasLegacyFields) visible = true
        }
      }
      if (!visible) return false

      // Aplicar filtro de responsable en el mismo pass
      if (idSet) return (event.charges?.length ? event.charges.some(charge => idSet.has(charge.user_id)) : false) || (event.charges?.length === 0)
      if (responsableId != null && typeof responsableId === 'number') {
        return (event.charges?.some(charge => charge.user_id === responsableId) ?? false) || (event.charges?.length === 0)
      }
      return true
    })
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
    const responsableIds = state.filters.value.responsable_ids
    const responsableId = state.filters.value.responsable_id
    const canViewAll = calendarPermissions.value.canViewAllActivities
    const idSet = responsableIds?.length ? new Set(responsableIds) : null
    const hasResponsableId = responsableId != null && typeof responsableId === 'number'

    // Optimización: sin filtros activos, devolver directamente sin iterar
    if (canViewAll && !idSet && !hasResponsableId) {
      return state.events.value
    }

    return state.events.value.filter(activity => {
      const noCharges = !activity.charges?.length
      if (noCharges) return true

      // Filtro de visibilidad para no-jefe (en el mismo pass)
      if (!canViewAll && hasResponsableId) {
        if (!(activity.charges?.some(charge => charge.user_id === responsableId) ?? false)) return false
      }

      // Filtro por responsable_ids (aplica a todos)
      if (idSet) return activity.charges?.some(charge => idSet.has(charge.user_id)) ?? false

      // Filtro por responsable_id único (jefe o no-jefe sin idSet)
      if (hasResponsableId && canViewAll) {
        return activity.charges?.some(charge => charge.user_id === responsableId) ?? false
      }

      return true
    })
  })

  // ============================================
  // UTILIDADES PARA EVENTOS MULTI-DÍA
  // ============================================

  const getEventColors = (event: CalendarEvent, options?: { usePriority?: boolean }): string[] => {
    const charges = event.charges || []
    // 1. Gris si la actividad está completada (todos los responsables en COMPLETADO)
    if (charges.length > 0 && charges.every((c: { status?: string }) => c.status === 'COMPLETADO')) {
      return ['#9ca3af']
    }

    const activityId = event.activity_id != null ? Number(event.activity_id) : null
    const catalogItem = activityId != null && !Number.isNaN(activityId)
      ? state.activityCatalog.value.find(a => Number(a.id) === activityId)
      : null
    const activityColor = catalogItem?.color_code && String(catalogItem.color_code).trim()
      ? String(catalogItem.color_code).trim()
      : null
    const consolidadoConfig = event.contenedor_id
      ? state.consolidadoColorConfig.value.find(c => c.contenedor_id === event.contenedor_id)
      : null
    const consolidadoColor = consolidadoConfig?.color_code ?? null
    const priorityColor = PRIORITY_COLORS[event.priority] || '#3b82f6'

    // Colores de perfil por usuario (todos los responsables del evento).
    // Priorizar siempre el color que viene en la API (user.color / responsable.color) si existe.
    const userColorsFromResponsables: string[] = []

    if (Array.isArray((event as any).responsables) && (event as any).responsables.length > 0) {
      for (const r of (event as any).responsables as { id: number; nombre?: string; color?: string }[]) {
        const apiColor = r.color && String(r.color).trim()
        const color = apiColor || getResponsableColor(r.id, r.nombre)
        if (color) {
          userColorsFromResponsables.push(color)
        }
      }
    } else if (Array.isArray(event.charges) && event.charges.length > 0) {
      for (const c of event.charges as any[]) {
        const uid = c.user_id ?? c.user?.id
        const nombre = c.user?.nombre
        const apiColor = c.user?.color && String(c.user.color).trim()
        if (uid != null) {
          const color = apiColor || getResponsableColor(uid, nombre)
          if (color) {
            userColorsFromResponsables.push(color)
          }
        }
      }
    }

    // Eliminar duplicados preservando orden
    const uniqueUserColors: string[] = []
    const seenColors = new Set<string>()
    for (const color of userColorsFromResponsables) {
      const normalized = color.toLowerCase()
      if (!seenColors.has(normalized)) {
        seenColors.add(normalized)
        uniqueUserColors.push(color)
      }
    }

    // Orden definido en role-groups según rol (JEFE vs MIEMBRO) del usuario en el grupo actual
    const order = effectiveColorOrder.value
    for (const key of order) {
      if (key === 'PRIORIDAD' && priorityColor) return [priorityColor]
      if (key === 'ACTIVIDAD' && activityColor) return [activityColor]
      if (key === 'CONSOLIDADO' && consolidadoColor) return [consolidadoColor]
      if (key === 'USUARIO' && uniqueUserColors.length > 0) {
        return uniqueUserColors
      }
    }
    return ['#3b82f6']
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
      // Cargar mis grupos de calendario y, si hay más de uno, usar role_group_id de la URL o el primero.
      const groups = await loadMyRoleGroups()
      const roleGroupIdFromQuery = route.query.role_group_id ? Number(route.query.role_group_id) : null
      const effectiveRoleGroupId = roleGroupIdFromQuery ?? (state.currentRoleGroupId.value ?? (groups[0]?.id ?? null))

      const config = await CalendarService.getCalendarConfig(effectiveRoleGroupId ?? undefined)
      calendarConfig.value = config
      state.currentRoleGroupId.value = config.role_group?.id ?? null

      await Promise.all([
        loadResponsables(force),
        loadContenedores(force),
        loadColorConfig(force),
        loadConsolidadoColorConfig(force),
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
    // Si el usuario es JEFE, limpiar filtros de responsable para que vea todo el equipo
    if (calendarConfig.value?.role_group?.role_type === 'JEFE') {
      clearFilters()
    }
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
    consolidadoColorConfig: computed(() => state.consolidadoColorConfig.value),
    activityCatalog: computed(() => state.activityCatalog.value),
    teamProgress: computed(() => state.teamProgress.value),
    responsableProgress: computed(() => state.responsableProgress.value),
    myProgressStats: computed(() => state.myProgressStats.value),
    loading: computed(() => state.loading.value),
    error: computed(() => state.error.value),
    filters: computed(() => state.filters.value),
    eventsPagination: computed(() => state.eventsPagination.value),
    initialized: computed(() => state.initialized.value),
    currentUserId: currentId,
    currentRoleGroupId: computed(() => state.currentRoleGroupId.value),
    myRoleGroups: computed(() => state.myRoleGroups.value),

    // Permisos
    calendarPermissions,
    isJefeImportaciones,
    isCoordinacionOrDocumentacion,
    usaConsolidado,

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
    updateEventStatus,
    updateEventPriority,

    // Notas
    updateChargeNotes,
    updateEventNotes,

    // Responsables
    loadResponsables,

    // Grupos del usuario
    loadMyRoleGroups,

    // Colores por usuario
    loadColorConfig,
    updateUserColor,
    getResponsableColor,

    // Colores por consolidado
    loadConsolidadoColorConfig,
    updateConsolidadoColors,
    updateConsolidadoColor,
    getConsolidadoColor,

    // Contenedores
    loadContenedores,

    // Catálogo de actividades
    loadActivityCatalog,
    createActivityInCatalog,
    updateActivityInCatalog,
    reorderActivityCatalog,
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
    refresh,

    // UI
    showEventDetails,

    /** Ruta de calendario con role_group_id en query (para que el backend sepa el grupo en cada petición). */
    getCalendarRoute: (path: string) => {
      const id = state.currentRoleGroupId.value
      if (id == null) return path
      const sep = path.includes('?') ? '&' : '?'
      return `${path}${sep}role_group_id=${id}`
    }
  }
}
