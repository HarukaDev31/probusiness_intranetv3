// Tipos del módulo Calendario. Reflejan exactamente lo que devuelve el backend
// (intranet_back: CalendarController, CalendarActivityController, CalendarRoleGroupController
// y CalendarEventService::formatEventForResponseWithColorMap).

// ============================================
// ENUMS
// ============================================

export type CalendarEventStatus = 'PENDIENTE' | 'PROGRESO' | 'COMPLETADO'

/** 0: Bajo, 1: Medio, 2: Alto */
export type CalendarEventPriority = 0 | 1 | 2

/** Rol del usuario dentro de un grupo de calendario (calendar_role_group_members.role_type). */
export type CalendarRoleType = 'JEFE' | 'MIEMBRO'

/** Fuentes de color del evento, en el orden de prioridad configurado por grupo. */
export type CalendarColorSource = 'ACTIVIDAD' | 'CONSOLIDADO' | 'USUARIO' | 'PRIORIDAD' | 'COMPLETADO'

/** Fecha en formato YYYY-MM-DD. */
export type IsoDate = string
/** Fecha-hora ISO 8601 (Carbon ->format('c')). */
export type IsoDateTime = string

// ============================================
// EVENTOS (GET /calendar/events, /activities/*)
// ============================================

/** Usuario resumido dentro de un charge (incluye el color configurado por el calendario). */
export interface CalendarChargeUser {
  id: number
  nombre: string
  email: string | null
  avatar: string | null
  color: string | null
}

export interface CalendarSubtask {
  id: number
  calendar_event_charge_id: number
  name: string
  duration_hours: number
  end_date: IsoDate | null
  status: CalendarEventStatus
  created_at: IsoDateTime | null
  updated_at: IsoDateTime | null
}

/** Responsable asignado a un evento (calendar_event_charges). */
export interface CalendarEventCharge {
  id: number
  calendar_id: number
  user_id: number
  calendar_event_id: number
  notes: string | null
  assigned_at: IsoDateTime | null
  removed_at: IsoDateTime | null
  status: CalendarEventStatus
  subtasks: CalendarSubtask[]
  user: CalendarChargeUser | null
}

export interface CalendarEventDay {
  id: number
  calendar_id: number
  calendar_event_id: number
  date: IsoDate
}

/** Consolidado asociado al evento. nombre = "Consolidado #19A" (incluye la parte si está partido). */
export interface CalendarEventContenedor {
  id: number
  nombre: string
  codigo: string
}

/** Evento tal como llega del backend. */
export interface CalendarEventApi {
  id: number
  calendar_id: number
  activity_id: number | null
  priority: CalendarEventPriority
  name: string
  contenedor_id: number | null
  display_order: number | null
  notes: string | null
  /** Derivado de los charges: COMPLETADO si todos, PENDIENTE si alguno, si no PROGRESO. */
  status: CalendarEventStatus
  created_at: IsoDateTime | null
  updated_at: IsoDateTime | null
  deleted_at: IsoDateTime | null
  days: CalendarEventDay[]
  charges: CalendarEventCharge[]
  contenedor: CalendarEventContenedor | null
  start_date: IsoDate | null
  end_date: IsoDate | null
  /** Días calendario entre start_date y end_date (inclusive). */
  duration: number
}

/** Evento ya procesado por el store (color base calculado). */
export interface CalendarEvent extends CalendarEventApi {
  color: string
}

// ============================================
// CATÁLOGOS Y CONFIGURACIÓN
// ============================================

/** GET /calendar/responsables */
export interface CalendarResponsable {
  id: number
  nombre: string
  email: string | null
  avatar: string | null
  color: string | null
}

/** GET /calendar/contenedores. nombre = "#19A - 2026". */
export interface CalendarContenedor {
  id: number
  nombre: string
  codigo: string
}

/** Color de un usuario en el calendario (lo mínimo que usa el front). */
export interface CalendarUserColor {
  user_id: number
  color_code: string
}

/** GET /calendar/colors */
export interface CalendarUserColorConfig extends CalendarUserColor {
  id: number
  calendar_id: number
  user: { id: number; nombre: string } | null
}

/** Color de un consolidado (lo mínimo que usa el front). */
export interface CalendarConsolidadoColor {
  contenedor_id: number
  color_code: string
}

/** GET /calendar/consolidado-colors */
export interface CalendarConsolidadoColorConfig extends CalendarConsolidadoColor {
  id: number
  calendar_id: number
  role_group_id: number
}

/** GET /calendar/activity-catalog */
export interface CalendarActivityCatalogItem {
  id: number
  name: string
  orden: number
  color_code: string | null
  allow_saturday: boolean
  allow_sunday: boolean
  default_priority: CalendarEventPriority
}

/** Campos opcionales al editar una actividad del catálogo (PUT /activity-catalog/{id}). */
export interface CalendarActivityCatalogExtras {
  allow_saturday?: boolean
  allow_sunday?: boolean
  default_priority?: CalendarEventPriority
}

/** Permisos devueltos por GET /calendar/config (CalendarPermissionService). */
export interface CalendarPermissions {
  canCreateActivity: boolean
  canEditActivity: boolean
  canDeleteActivity: boolean
  canAssignResponsables: boolean
  canEditAnyStatus: boolean
  canEditOwnStatus: boolean
  canEditPriority: boolean
  canViewTeamProgress: boolean
  canFilterByResponsable: boolean
  canAccessConfig: boolean
}

/** GET /calendar/config */
export interface CalendarConfig {
  role_group: {
    id: number
    name: string
    code: string | null
    /** NINGUNO si el usuario no es miembro del grupo resuelto. */
    role_type: CalendarRoleType | 'NINGUNO'
  } | null
  permissions: CalendarPermissions
  colors: {
    prioridad: string | null
    actividad: string | null
    consolidado: string | null
    completado: string | null
  } | null
  color_priority_order: {
    jefe: CalendarColorSource[]
    miembro: CalendarColorSource[]
  }
  show_event_details: boolean
  usa_consolidado: boolean
}

// ============================================
// GRUPOS DE ROLES
// ============================================

/** GET /calendar/role-groups */
export interface CalendarRoleGroup {
  id: number
  name: string
  code: string | null
  usa_consolidado: boolean
  is_active: boolean
}

/** GET /calendar/my-role-groups: incluye el rol del usuario en cada grupo. */
export interface CalendarMyRoleGroup extends CalendarRoleGroup {
  role_type: CalendarRoleType | null
}

export interface CalendarRoleGroupPayload {
  name: string
  code: string | null
  usa_consolidado: boolean
  is_active: boolean
}

/** GET /calendar/role-groups/{id}/members */
export interface CalendarRoleGroupMember {
  id: number
  user_id: number
  role_type: CalendarRoleType
  user: { id: number; nombre: string; email: string | null } | null
}

/** Modelo crudo devuelto por POST /role-groups/{id}/members (sin relación user). */
export interface CalendarRoleGroupMemberRecord {
  id: number
  role_group_id: number
  user_id: number
  role_type: CalendarRoleType
}

/** GET/PUT /calendar/role-groups/{id}/config (modelo CalendarRoleGroupConfig). */
export interface CalendarRoleGroupConfig {
  id: number
  role_group_id: number
  color_prioridad: string | null
  color_actividad: string | null
  color_consolidado: string | null
  color_completado: string | null
  /** CSV de CalendarColorSource. */
  jefe_color_priority_order: string | null
  /** CSV de CalendarColorSource. */
  miembro_color_priority_order: string | null
  show_event_details: boolean
}

export interface CalendarRoleGroupConfigPayload {
  jefe_color_priority_order?: string | null
  miembro_color_priority_order?: string | null
  usa_consolidado?: boolean
  show_event_details?: boolean
}

/** GET /calendar/users */
export interface CalendarIntranetUser {
  id: number
  nombre: string
  email: string | null
}

// ============================================
// PROGRESO
// ============================================

/** GET /calendar/progress → data.team */
export interface TeamProgress {
  total_actividades: number
  completadas: number
  en_progreso: number
  pendientes: number
  porcentaje_completado: number
}

/** GET /calendar/progress → data.by_responsable[] */
export interface ResponsableProgress {
  user_id: number
  nombre: string | null
  color: string | null
  total_asignadas: number
  completadas: number
  en_progreso: number
  pendientes: number
  porcentaje_completado: number
}

export interface CalendarProgress {
  team: TeamProgress
  by_responsable: ResponsableProgress[]
}

/** my_progress / global_progress de GET /calendar/events paginado. */
export interface CalendarProgressStats {
  total: number
  completadas: number
  en_progreso: number
  pendientes: number
}

// ============================================
// REQUESTS
// ============================================

/** POST /calendar/activities y PUT /calendar/activities/{id} */
export interface CreateCalendarEventRequest {
  name: string
  activity_id: number | null
  priority: CalendarEventPriority
  contenedor_id: number | null
  notes: string | null
  start_date: IsoDate
  end_date: IsoDate
  /** Máximo 2 responsables. */
  responsable_ids: number[]
}

export interface UpdateCalendarEventRequest extends CreateCalendarEventRequest {
  id: number
}

export interface CreateSubtaskRequest {
  name: string
  duration_hours: number
  status: CalendarEventStatus
  end_date: IsoDate | null
}

export type UpdateSubtaskRequest = Partial<CreateSubtaskRequest>

// ============================================
// FILTROS Y RESPUESTAS
// ============================================

export interface CalendarFilters {
  start_date?: IsoDate
  end_date?: IsoDate
  /** Un responsable (no-jefe: "Yo"). */
  responsable_id?: number
  /** Varios responsables (jefe). Se envía como responsable_ids[]. */
  responsable_ids?: number[]
  /** Varios consolidados. Se envía como contenedor_ids[]. */
  contenedor_ids?: number[]
  status?: CalendarEventStatus
  priority?: CalendarEventPriority
  /** Un único evento (ej. al ir a progreso desde el calendario). */
  event_id?: number
  /** Paginación: con page y per_page el backend devuelve meta + my_progress + global_progress. */
  page?: number
  per_page?: number
  role_group_id?: number
  /** 1 = solo actividades con al menos un responsable. */
  has_charges?: 0 | 1
  /** 1 = más recientes primero. */
  order_desc?: 0 | 1
}

export interface CalendarPaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ApiMessageResponse {
  success: boolean
  message?: string
}

/** GET /calendar/events */
export interface CalendarEventsResponse extends ApiResponse<CalendarEventApi[]> {
  /** Solo con page/per_page. */
  meta?: CalendarPaginationMeta
  my_progress?: CalendarProgressStats | null
  global_progress?: CalendarProgressStats | null
}
