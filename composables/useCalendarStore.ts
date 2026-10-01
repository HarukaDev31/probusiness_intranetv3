import { CalendarService } from '~/services/calendar/calendarService'
import type {
  CalendarActivityCatalogExtras,
  CalendarActivityCatalogItem,
  CalendarColorSource,
  CalendarConfig,
  CalendarConsolidadoColor,
  CalendarContenedor,
  CalendarEvent,
  CalendarEventApi,
  CalendarEventCharge,
  CalendarEventPriority,
  CalendarEventStatus,
  CalendarFilters,
  CalendarMyRoleGroup,
  CalendarPaginationMeta,
  CalendarPermissions,
  CalendarProgressStats,
  CalendarResponsable,
  CalendarSubtask,
  CalendarUserColor,
  CreateCalendarEventRequest,
  CreateSubtaskRequest,
  ResponsableProgress,
  TeamProgress,
  UpdateCalendarEventRequest,
  UpdateSubtaskRequest
} from '~/types/calendar'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useUserRole } from '~/composables/auth/useUserRole'
import { markCalendarActionByCurrentUser } from '~/config/websocket/events/calendar'
import {
  COMPLETED_HEX,
  DEFAULT_JEFE_COLOR_ORDER,
  DEFAULT_MIEMBRO_COLOR_ORDER,
  DEFAULT_RESPONSABLE_COLORS,
  FALLBACK_HEX,
  PRIORITY_HEX
} from '~/constants/calendar'
import { deriveStatusFromCharges, deriveStatusFromSubtasks, getEventEndDate, getEventStartDate } from '~/utils/calendar/events'

const { withSpinner } = useSpinner()

/** Recursos cacheados en memoria (TTL de 5 minutos). */
type CacheKey = 'events' | 'responsables' | 'contenedores' | 'colorConfig' | 'consolidadoColorConfig' | 'activityCatalog' | 'progress'

const CACHE_TTL_MS = 5 * 60 * 1000

const EMPTY_PERMISSIONS: CalendarPermissions = {
  canCreateActivity: false,
  canEditActivity: false,
  canDeleteActivity: false,
  canAssignResponsables: false,
  canEditAnyStatus: false,
  canEditOwnStatus: false,
  canEditPriority: false,
  canViewTeamProgress: false,
  canFilterByResponsable: false,
  canAccessConfig: false
}

const emptyFilters = (): CalendarFilters => ({})

// Estado global compartido entre todas las vistas del calendario (singleton)
const state = {
  events: shallowRef<CalendarEvent[]>([]),
  responsables: ref<CalendarResponsable[]>([]),
  contenedores: ref<CalendarContenedor[]>([]),
  colorConfig: ref<CalendarUserColor[]>([]),
  consolidadoColorConfig: ref<CalendarConsolidadoColor[]>([]),
  activityCatalog: ref<CalendarActivityCatalogItem[]>([]),
  teamProgress: ref<TeamProgress | null>(null),
  responsableProgress: ref<ResponsableProgress[]>([]),
  myProgressStats: ref<CalendarProgressStats | null>(null),
  globalProgressStats: ref<CalendarProgressStats | null>(null),

  /** Solo carga de listas (eventos / inicialización). Las mutaciones no lo activan. */
  loading: ref(false),
  error: ref<string | null>(null),

  filters: ref<CalendarFilters>(emptyFilters()),
  eventsPagination: ref<CalendarPaginationMeta | null>(null),
  lastEventsQuery: '',
  /** Filtros de la última consulta de eventos (para "Recargar vista actual"). */
  lastEventsFilters: {} as CalendarFilters,

  lastFetch: {
    events: 0,
    responsables: 0,
    contenedores: 0,
    colorConfig: 0,
    consolidadoColorConfig: 0,
    activityCatalog: 0,
    progress: 0
  } as Record<CacheKey, number>,

  initialized: false,
  calendarConfig: ref<CalendarConfig | null>(null),
  /** Grupo activo; se envía en las peticiones y se sincroniza con ?role_group_id. */
  currentRoleGroupId: ref<number | null>(null),
  /** Grupos donde el usuario es JEFE (selector de calendarios). */
  myRoleGroups: ref<CalendarMyRoleGroup[]>([])
}

const isFresh = (key: CacheKey) => Date.now() - state.lastFetch[key] < CACHE_TTL_MS

const errorMessage = (err: unknown, fallback: string): string =>
  err instanceof Error && err.message ? err.message : fallback

/** Reemplaza el evento por id generando un nuevo array (state.events es shallowRef). */
const replaceEvent = (id: number, update: (event: CalendarEvent) => CalendarEvent) => {
  state.events.value = state.events.value.map(e => (e.id === id ? update(e) : e))
}

/** Actualiza un charge (y el estado derivado del evento) sin recargar la lista. */
const updateChargeInEvents = (chargeId: number, update: (charge: CalendarEventCharge) => CalendarEventCharge) => {
  state.events.value = state.events.value.map(event => {
    if (!event.charges.some(c => c.id === chargeId)) return event
    const charges = event.charges.map(c => (c.id === chargeId ? update(c) : c))
    return { ...event, charges, status: deriveStatusFromCharges(charges) }
  })
}

const updateSubtasksOfCharge = (chargeId: number, update: (subtasks: CalendarSubtask[]) => CalendarSubtask[]) => {
  updateChargeInEvents(chargeId, charge => {
    const subtasks = update(charge.subtasks)
    return { ...charge, subtasks, status: deriveStatusFromSubtasks(subtasks) }
  })
}

const chargeIdOfSubtask = (subtaskId: number): number | null => {
  for (const event of state.events.value) {
    for (const charge of event.charges) {
      if (charge.subtasks.some(s => s.id === subtaskId)) return charge.id
    }
  }
  return null
}

export const useCalendarStore = () => {
  const { currentId } = useUserRole()
  const route = useRoute()

  const currentUserIdNum = computed(() => Number(currentId.value) || 0)

  // ============================================
  // CONFIGURACIÓN Y PERMISOS
  // ============================================

  const calendarConfig = state.calendarConfig
  const calendarPermissions = computed<CalendarPermissions>(() => calendarConfig.value?.permissions ?? EMPTY_PERMISSIONS)
  const isJefeImportaciones = computed(() => calendarConfig.value?.role_group?.role_type === 'JEFE')
  const isCoordinacionOrDocumentacion = computed(() => {
    const roleType = calendarConfig.value?.role_group?.role_type
    return roleType === 'JEFE' || roleType === 'MIEMBRO'
  })
  const usaConsolidado = computed(() => calendarConfig.value?.usa_consolidado ?? true)
  const showEventDetails = computed(() => calendarConfig.value?.show_event_details ?? false)

  /** Orden de prioridad de colores según el rol del usuario en el grupo activo. */
  const effectiveColorOrder = computed<CalendarColorSource[]>(() => {
    const order = calendarConfig.value?.color_priority_order
    if (isJefeImportaciones.value) return order?.jefe?.length ? order.jefe : DEFAULT_JEFE_COLOR_ORDER
    return order?.miembro?.length ? order.miembro : DEFAULT_MIEMBRO_COLOR_ORDER
  })

  const roleGroupIdFromRoute = (): number | null => {
    const raw = route.query.role_group_id
    const parsed = typeof raw === 'string' ? Number.parseInt(raw, 10) : Number.NaN
    return Number.isNaN(parsed) ? null : parsed
  }

  const roleGroupFilter = (): { role_group_id?: number } =>
    state.currentRoleGroupId.value != null ? { role_group_id: state.currentRoleGroupId.value } : {}

  // ============================================
  // COLORES
  // ============================================

  const getResponsableColor = (userId: number, nombre?: string | null): string => {
    const config = state.colorConfig.value.find(c => c.user_id === userId)
    if (config?.color_code) return config.color_code
    if (nombre && DEFAULT_RESPONSABLE_COLORS[nombre]) return DEFAULT_RESPONSABLE_COLORS[nombre]
    return FALLBACK_HEX
  }

  const getConsolidadoColor = (contenedorId: number): string =>
    state.consolidadoColorConfig.value.find(c => c.contenedor_id === contenedorId)?.color_code ?? FALLBACK_HEX

  const activityColorOf = (activityId: number | null): string | null => {
    if (activityId == null) return null
    const color = state.activityCatalog.value.find(a => a.id === activityId)?.color_code?.trim()
    return color || null
  }

  const consolidadoColorOf = (contenedorId: number | null): string | null =>
    contenedorId == null
      ? null
      : state.consolidadoColorConfig.value.find(c => c.contenedor_id === contenedorId)?.color_code ?? null

  /** Color base del evento (actividad > consolidado > prioridad). */
  const baseColorOf = (event: CalendarEventApi): string =>
    activityColorOf(event.activity_id) ?? consolidadoColorOf(event.contenedor_id) ?? PRIORITY_HEX[event.priority] ?? PRIORITY_HEX[0]

  const toCalendarEvent = (event: CalendarEventApi): CalendarEvent => ({
    ...event,
    start_date: getEventStartDate(event),
    end_date: getEventEndDate(event) ?? getEventStartDate(event),
    color: baseColorOf(event)
  })

  /**
   * Colores con que se pinta un evento, según el orden de prioridad del grupo.
   * USUARIO devuelve un color por responsable (gris si ese responsable ya completó).
   */
  const getEventColors = (event: CalendarEvent): string[] => {
    const priorityColor = PRIORITY_HEX[event.priority] ?? PRIORITY_HEX[0]
    const isCompleted = event.status === 'COMPLETADO'
    const userColors = event.charges.map(c =>
      c.status === 'COMPLETADO' ? COMPLETED_HEX : (c.user?.color?.trim() || getResponsableColor(c.user_id, c.user?.nombre))
    )
    const sources: Record<CalendarColorSource, () => string[] | null> = {
      COMPLETADO: () => (isCompleted ? [COMPLETED_HEX] : null),
      PRIORIDAD: () => [priorityColor],
      ACTIVIDAD: () => { const c = activityColorOf(event.activity_id); return c ? [c] : null },
      CONSOLIDADO: () => { const c = consolidadoColorOf(event.contenedor_id); return c ? [c] : null },
      USUARIO: () => (userColors.length ? userColors : null)
    }
    for (const key of effectiveColorOrder.value) {
      const colors = sources[key]?.()
      if (colors) return colors
    }
    return [isCompleted ? COMPLETED_HEX : priorityColor]
  }

  const loadColorConfig = async (force = false): Promise<CalendarUserColor[]> => {
    if (!force && isFresh('colorConfig') && state.colorConfig.value.length) return state.colorConfig.value
    try {
      state.colorConfig.value = await CalendarService.getColorConfig()
      state.lastFetch.colorConfig = Date.now()
    } catch (err) {
      console.error('Error al cargar configuración de colores:', err)
    }
    return state.colorConfig.value
  }

  const updateUserColor = async (userId: number, colorCode: string): Promise<boolean> => {
    const hex = colorCode.startsWith('#') ? colorCode : `#${colorCode}`
    try {
      await CalendarService.updateUserColor(userId, hex)
      const others = state.colorConfig.value.filter(c => c.user_id !== userId)
      state.colorConfig.value = [...others, { user_id: userId, color_code: hex }]
      return true
    } catch (err) {
      state.error.value = errorMessage(err, 'Error al actualizar color')
      return false
    }
  }

  const loadConsolidadoColorConfig = async (force = false): Promise<CalendarConsolidadoColor[]> => {
    if (!force && isFresh('consolidadoColorConfig') && state.consolidadoColorConfig.value.length) return state.consolidadoColorConfig.value
    try {
      state.consolidadoColorConfig.value = await CalendarService.getConsolidadoColorConfig()
      state.lastFetch.consolidadoColorConfig = Date.now()
    } catch (err) {
      console.error('Error al cargar colores de consolidados:', err)
    }
    return state.consolidadoColorConfig.value
  }

  /** Guarda varios colores de consolidado en una sola petición. */
  const updateConsolidadoColors = async (items: CalendarConsolidadoColor[]): Promise<boolean> => {
    try {
      await CalendarService.updateConsolidadoColors(items)
      const changedIds = new Set(items.map(i => i.contenedor_id))
      state.consolidadoColorConfig.value = [
        ...state.consolidadoColorConfig.value.filter(c => !changedIds.has(c.contenedor_id)),
        ...items
      ]
      return true
    } catch (err) {
      state.error.value = errorMessage(err, 'Error al actualizar colores de consolidados')
      return false
    }
  }

  // ============================================
  // CATÁLOGOS
  // ============================================

  const loadResponsables = async (force = false): Promise<CalendarResponsable[]> => {
    if (!force && isFresh('responsables') && state.responsables.value.length) return state.responsables.value
    try {
      state.responsables.value = await CalendarService.getResponsables(state.currentRoleGroupId.value)
      state.lastFetch.responsables = Date.now()
    } catch (err) {
      console.error('Error al cargar responsables:', err)
    }
    return state.responsables.value
  }

  const loadContenedores = async (force = false): Promise<CalendarContenedor[]> => {
    if (!force && isFresh('contenedores') && state.contenedores.value.length) return state.contenedores.value
    try {
      state.contenedores.value = await CalendarService.getContenedores()
      state.lastFetch.contenedores = Date.now()
    } catch (err) {
      console.error('Error al cargar consolidados:', err)
    }
    return state.contenedores.value
  }

  /** Solo grupos donde el usuario es JEFE (los miembros no eligen calendario). */
  const loadMyRoleGroups = async (): Promise<CalendarMyRoleGroup[]> => {
    try {
      const groups = await CalendarService.getMyRoleGroups()
      state.myRoleGroups.value = groups.filter(g => g.role_type === 'JEFE')
    } catch (err) {
      console.error('Error al cargar grupos de calendario del usuario:', err)
      state.myRoleGroups.value = []
    }
    if (state.currentRoleGroupId.value == null && state.myRoleGroups.value.length) {
      state.currentRoleGroupId.value = state.myRoleGroups.value[0].id
    }
    return state.myRoleGroups.value
  }

  const requireRoleGroupId = (): number | null => {
    if (state.currentRoleGroupId.value == null) {
      const fromRoute = roleGroupIdFromRoute()
      if (fromRoute != null) state.currentRoleGroupId.value = fromRoute
    }
    return state.currentRoleGroupId.value
  }

  const loadActivityCatalog = async (force = false): Promise<CalendarActivityCatalogItem[]> => {
    const roleGroupId = requireRoleGroupId()
    if (roleGroupId == null) {
      state.activityCatalog.value = []
      return []
    }
    if (!force && isFresh('activityCatalog') && state.activityCatalog.value.length) return state.activityCatalog.value
    try {
      state.activityCatalog.value = await CalendarService.getActivityCatalog(roleGroupId)
      state.lastFetch.activityCatalog = Date.now()
    } catch (err) {
      console.error('Error al cargar catálogo de actividades:', err)
    }
    return state.activityCatalog.value
  }

  const createActivityInCatalog = async (name: string): Promise<CalendarActivityCatalogItem | null> => {
    const roleGroupId = requireRoleGroupId()
    if (roleGroupId == null) {
      state.error.value = 'No hay grupo de calendario seleccionado'
      return null
    }
    try {
      const activity = await CalendarService.createActivityCatalog(name, roleGroupId)
      state.activityCatalog.value = [...state.activityCatalog.value, activity]
      return activity
    } catch (err) {
      state.error.value = errorMessage(err, 'Error al crear actividad en catálogo')
      return null
    }
  }

  /** colorCode: undefined = no tocar; null = quitar color. */
  const updateActivityInCatalog = async (
    id: number,
    name: string,
    colorCode?: string | null,
    extras?: CalendarActivityCatalogExtras
  ): Promise<boolean> => {
    const roleGroupId = requireRoleGroupId()
    if (roleGroupId == null) {
      state.error.value = 'No hay grupo de calendario seleccionado'
      return false
    }
    try {
      const updated = await CalendarService.updateActivityCatalog(id, name, roleGroupId, colorCode, extras)
      state.activityCatalog.value = state.activityCatalog.value.map(a => (a.id === id ? updated : a))
      // Re-aplicar color a los eventos de esa actividad sin recargar
      if (state.events.value.some(e => e.activity_id === id)) {
        state.events.value = state.events.value.map(e => (e.activity_id === id ? toCalendarEvent(e) : e))
      }
      return true
    } catch (err) {
      state.error.value = errorMessage(err, 'Error al actualizar actividad del catálogo')
      return false
    }
  }

  const reorderActivityCatalog = async (ids: number[]): Promise<boolean> => {
    const roleGroupId = requireRoleGroupId()
    if (roleGroupId == null) return false
    try {
      await CalendarService.reorderActivityCatalog(ids, roleGroupId)
      const byId = new Map(state.activityCatalog.value.map(a => [a.id, a]))
      state.activityCatalog.value = ids
        .map(id => byId.get(id))
        .filter((a): a is CalendarActivityCatalogItem => a !== undefined)
      return true
    } catch (err) {
      state.error.value = errorMessage(err, 'Error al reordenar catálogo')
      return false
    }
  }

  const deleteActivityFromCatalog = async (catalogId: number): Promise<boolean> => {
    const roleGroupId = requireRoleGroupId()
    if (roleGroupId == null) return false
    try {
      await CalendarService.deleteActivityCatalog(catalogId, roleGroupId)
      state.activityCatalog.value = state.activityCatalog.value.filter(a => a.id !== catalogId)
      return true
    } catch (err) {
      state.error.value = errorMessage(err, 'Error al eliminar del catálogo')
      return false
    }
  }

  // ============================================
  // EVENTOS
  // ============================================

  /**
   * Carga eventos con los filtros del store + los recibidos.
   * Si la consulta es la misma y está fresca, no vuelve a pedirla (salvo force).
   */
  const getEvents = async (filters: CalendarFilters = {}, force = false): Promise<CalendarEvent[]> => {
    const applied: CalendarFilters = { ...state.filters.value, ...filters, ...roleGroupFilter() }
    const queryKey = JSON.stringify(applied)
    if (!force && queryKey === state.lastEventsQuery && isFresh('events')) return state.events.value

    state.loading.value = true
    state.error.value = null
    try {
      const response = await CalendarService.getEvents(applied)
      state.events.value = (response.data ?? []).map(toCalendarEvent)
      state.eventsPagination.value = response.meta ?? null
      if (response.my_progress) state.myProgressStats.value = response.my_progress
      if (response.global_progress) state.globalProgressStats.value = response.global_progress
      state.lastFetch.events = Date.now()
      state.lastEventsQuery = queryKey
      state.lastEventsFilters = applied
    } catch (err) {
      state.error.value = errorMessage(err, 'Error al cargar eventos')
      console.error('Error en getEvents:', err)
    } finally {
      state.loading.value = false
    }
    return state.events.value
  }

  const createActivity = async (data: CreateCalendarEventRequest): Promise<CalendarEvent | null> => {
    state.error.value = null
    try {
      const created = await withSpinner(() => CalendarService.createActivity(data), 'Creando actividad...')
      markCalendarActionByCurrentUser()
      // No se agrega a la lista: el caller recarga con sus filtros (evita duplicados y respeta el rango).
      state.lastFetch.events = 0
      state.lastFetch.progress = 0
      return toCalendarEvent(created)
    } catch (err) {
      state.error.value = errorMessage(err, 'Error al crear actividad')
      return null
    }
  }

  const updateActivity = async (data: UpdateCalendarEventRequest): Promise<CalendarEvent | null> => {
    state.error.value = null
    try {
      const updated = toCalendarEvent(await withSpinner(() => CalendarService.updateActivity(data), 'Actualizando actividad...'))
      markCalendarActionByCurrentUser()
      replaceEvent(data.id, () => updated)
      state.lastFetch.events = 0
      state.lastFetch.progress = 0
      return updated
    } catch (err) {
      state.error.value = errorMessage(err, 'Error al actualizar actividad')
      return null
    }
  }

  const deleteActivity = async (id: number): Promise<boolean> => {
    state.error.value = null
    try {
      await withSpinner(() => CalendarService.deleteActivity(id), 'Eliminando actividad...')
      markCalendarActionByCurrentUser()
      state.events.value = state.events.value.filter(e => e.id !== id)
      state.lastFetch.events = 0
      state.lastFetch.progress = 0
      return true
    } catch (err) {
      state.error.value = errorMessage(err, 'Error al eliminar actividad')
      return false
    }
  }

  /** Orden manual de eventos en la vista mes. */
  const reorderEvents = async (ids: number[]): Promise<boolean> => {
    try {
      const response = await CalendarService.reorderEvents(ids)
      if (!response.success) return false
      const position = new Map(ids.map((id, i) => [id, i]))
      state.events.value = [...state.events.value].sort((a, b) =>
        (position.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (position.get(b.id) ?? Number.MAX_SAFE_INTEGER)
        || (a.start_date ?? '').localeCompare(b.start_date ?? '')
        || a.id - b.id
      )
      return true
    } catch (err) {
      console.error('Error al reordenar eventos:', err)
      return false
    }
  }

  // ============================================
  // ESTADO, PRIORIDAD, NOTAS Y SUBTAREAS
  // (actualizan la lista local; no recargan)
  // ============================================

  const updateChargeStatus = async (chargeId: number, status: CalendarEventStatus): Promise<boolean> => {
    try {
      await CalendarService.updateChargeStatus(chargeId, status)
      updateChargeInEvents(chargeId, c => ({ ...c, status }))
      state.lastFetch.progress = 0
      return true
    } catch (err) {
      state.error.value = errorMessage(err, 'Error al actualizar estado')
      return false
    }
  }

  /** Estado de toda la actividad (solo jefe). */
  const updateEventStatus = async (eventId: number, status: CalendarEventStatus): Promise<boolean> => {
    try {
      const updated = toCalendarEvent(await CalendarService.updateEventStatus(eventId, status))
      replaceEvent(eventId, () => updated)
      state.lastFetch.progress = 0
      return true
    } catch (err) {
      state.error.value = errorMessage(err, 'Error al actualizar estado')
      return false
    }
  }

  const updateEventPriority = async (eventId: number, priority: CalendarEventPriority): Promise<boolean> => {
    try {
      await CalendarService.updateEventPriority(eventId, priority)
      replaceEvent(eventId, e => toCalendarEvent({ ...e, priority }))
      return true
    } catch (err) {
      state.error.value = errorMessage(err, 'Error al actualizar prioridad')
      return false
    }
  }

  const updateChargeNotes = async (chargeId: number, notes: string): Promise<boolean> => {
    try {
      await CalendarService.updateChargeNotes(chargeId, notes)
      updateChargeInEvents(chargeId, c => ({ ...c, notes }))
      return true
    } catch (err) {
      state.error.value = errorMessage(err, 'Error al actualizar notas')
      return false
    }
  }

  const updateEventNotes = async (eventId: number, notes: string): Promise<boolean> => {
    try {
      await CalendarService.updateEventNotes(eventId, notes)
      replaceEvent(eventId, e => ({ ...e, notes }))
      return true
    } catch (err) {
      state.error.value = errorMessage(err, 'Error al actualizar notas')
      return false
    }
  }

  const createSubtask = async (chargeId: number, payload: CreateSubtaskRequest): Promise<CalendarSubtask | null> => {
    try {
      const subtask = await CalendarService.createSubtask(chargeId, payload)
      updateSubtasksOfCharge(chargeId, list => [...list, subtask])
      return subtask
    } catch (err) {
      state.error.value = errorMessage(err, 'Error al crear subtarea')
      return null
    }
  }

  const updateSubtask = async (subtaskId: number, payload: UpdateSubtaskRequest): Promise<boolean> => {
    try {
      const updated = await CalendarService.updateSubtask(subtaskId, payload)
      updateSubtasksOfCharge(updated.calendar_event_charge_id, list => list.map(s => (s.id === subtaskId ? updated : s)))
      return true
    } catch (err) {
      state.error.value = errorMessage(err, 'Error al actualizar subtarea')
      return false
    }
  }

  const deleteSubtask = async (subtaskId: number): Promise<boolean> => {
    const chargeId = chargeIdOfSubtask(subtaskId)
    try {
      await CalendarService.deleteSubtask(subtaskId)
      if (chargeId != null) updateSubtasksOfCharge(chargeId, list => list.filter(s => s.id !== subtaskId))
      return true
    } catch (err) {
      state.error.value = errorMessage(err, 'Error al eliminar subtarea')
      return false
    }
  }

  // ============================================
  // PROGRESO
  // ============================================

  /** Progreso del equipo (solo jefe). Con filtros explícitos siempre consulta. */
  const loadProgress = async (filters?: CalendarFilters, force = false): Promise<void> => {
    if (!calendarPermissions.value.canViewTeamProgress) return
    const hasExplicitFilters = !!filters && Object.values(filters).some(v => v !== undefined)
    if (!hasExplicitFilters && !force && isFresh('progress') && state.teamProgress.value) return
    try {
      const data = await CalendarService.getProgress({ ...(hasExplicitFilters ? filters : state.filters.value), ...roleGroupFilter() })
      state.teamProgress.value = data.team
      state.responsableProgress.value = data.by_responsable
      if (!hasExplicitFilters) state.lastFetch.progress = Date.now()
    } catch (err) {
      console.error('Error al cargar progreso:', err)
    }
  }

  // ============================================
  // FILTROS
  // ============================================

  const setFilters = (filters: CalendarFilters) => {
    state.filters.value = { ...state.filters.value, ...filters }
  }

  const clearFilters = () => {
    state.filters.value = emptyFilters()
  }

  /**
   * Eventos visibles en la grilla: con filtro de responsable(s) se muestran los suyos
   * y también los que no tienen responsable asignado.
   */
  const visibleEvents = computed(() => {
    const { responsable_ids: ids, responsable_id: single } = state.filters.value
    const wanted = ids?.length ? new Set(ids) : single != null ? new Set([single]) : null
    if (!wanted) return state.events.value
    return state.events.value.filter(e => e.charges.length === 0 || e.charges.some(c => wanted.has(c.user_id)))
  })

  /**
   * Actividades de las tablas (progreso / registro). Con responsable_ids se excluyen las
   * actividades sin responsable; con un único responsable_id se mantienen.
   */
  const visibleActivities = computed(() => {
    const { responsable_ids: ids, responsable_id: single } = state.filters.value
    const idSet = ids?.length ? new Set(ids) : null
    if (!idSet && single == null) return state.events.value
    return state.events.value.filter(activity => {
      if (activity.charges.length === 0) return !idSet
      if (single != null && !activity.charges.some(c => c.user_id === single)) return false
      if (idSet) return activity.charges.some(c => idSet.has(c.user_id))
      return true
    })
  })

  // ============================================
  // INICIALIZACIÓN
  // ============================================

  /** Carga grupo activo, configuración y catálogos. Sin force no repite si ya se hizo. */
  const initialize = async (force = false): Promise<void> => {
    if (state.initialized && !force) return
    state.loading.value = true
    try {
      const groups = await loadMyRoleGroups()
      const requestedId = roleGroupIdFromRoute() ?? state.currentRoleGroupId.value ?? groups[0]?.id ?? null
      const config = await CalendarService.getCalendarConfig(requestedId)
      state.calendarConfig.value = config
      state.currentRoleGroupId.value = config.role_group?.id ?? null
      await Promise.all([
        loadResponsables(force),
        loadContenedores(force),
        loadColorConfig(force),
        loadConsolidadoColorConfig(force),
        loadActivityCatalog(force)
      ])
      state.initialized = true
    } catch (err) {
      state.error.value = errorMessage(err, 'Error al cargar la configuración del calendario')
    } finally {
      state.loading.value = false
    }
  }

  const invalidateCache = (key?: CacheKey) => {
    if (key) {
      state.lastFetch[key] = 0
      return
    }
    for (const k of Object.keys(state.lastFetch) as CacheKey[]) state.lastFetch[k] = 0
  }

  /** La configuración del grupo cambió (role-groups): la próxima initialize() la vuelve a pedir. */
  const invalidateConfig = () => {
    state.initialized = false
    invalidateCache()
  }

  /**
   * Recarga configuración y catálogos. Con reloadEvents repite la última consulta de eventos
   * de la vista actual (misma página/filtros) en el grupo activo.
   */
  const refresh = async ({ reloadEvents = true }: { reloadEvents?: boolean } = {}): Promise<void> => {
    invalidateCache()
    await initialize(true)
    if (!reloadEvents) return
    const { role_group_id: _previousGroup, ...lastFilters } = state.lastEventsFilters
    await getEvents(lastFilters, true)
  }

  /** Ruta del calendario con role_group_id en query. */
  const getCalendarRoute = (path: string): string => {
    const id = state.currentRoleGroupId.value
    if (id == null) return path
    return `${path}${path.includes('?') ? '&' : '?'}role_group_id=${id}`
  }

  return {
    // Estado
    events: computed(() => state.events.value),
    visibleEvents,
    visibleActivities,
    responsables: computed(() => state.responsables.value),
    contenedores: computed(() => state.contenedores.value),
    activityCatalog: computed(() => state.activityCatalog.value),
    teamProgress: computed(() => state.teamProgress.value),
    responsableProgress: computed(() => state.responsableProgress.value),
    myProgressStats: computed(() => state.myProgressStats.value),
    globalProgressStats: computed(() => state.globalProgressStats.value),
    loading: computed(() => state.loading.value),
    error: computed(() => state.error.value),
    filters: computed(() => state.filters.value),
    eventsPagination: computed(() => state.eventsPagination.value),
    currentUserId: currentUserIdNum,
    currentRoleGroupId: computed(() => state.currentRoleGroupId.value),
    myRoleGroups: computed(() => state.myRoleGroups.value),

    // Permisos
    calendarPermissions,
    isJefeImportaciones,
    isCoordinacionOrDocumentacion,
    usaConsolidado,
    showEventDetails,

    // Eventos
    getEvents,
    createActivity,
    updateActivity,
    deleteActivity,
    reorderEvents,
    updateChargeStatus,
    updateEventStatus,
    updateEventPriority,
    updateChargeNotes,
    updateEventNotes,
    createSubtask,
    updateSubtask,
    deleteSubtask,

    // Catálogos y colores
    loadResponsables,
    loadContenedores,
    loadColorConfig,
    updateUserColor,
    getResponsableColor,
    loadConsolidadoColorConfig,
    updateConsolidadoColors,
    getConsolidadoColor,
    getEventColors,
    loadActivityCatalog,
    createActivityInCatalog,
    updateActivityInCatalog,
    reorderActivityCatalog,
    deleteActivityFromCatalog,

    // Progreso
    loadProgress,

    // Filtros
    setFilters,
    clearFilters,

    // Ciclo de vida
    initialize,
    invalidateCache,
    invalidateConfig,
    refresh,
    getCalendarRoute
  }
}
