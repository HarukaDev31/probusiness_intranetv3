// ============================================
// TIPOS BASADOS EN TABLAS DEL BACKEND
// ============================================

// Estados de una actividad/carga
export type CalendarEventStatus = 'PENDIENTE' | 'PROGRESO' | 'COMPLETADO'

// Prioridades de una actividad
export type CalendarEventPriority = 0 | 1 | 2 // 0: Bajo, 1: Medio, 2: Alto

export const PRIORITY_LABELS: Record<CalendarEventPriority, string> = {
  0: 'Bajo',
  1: 'Medio',
  2: 'Alto'
}

export const PRIORITY_COLORS: Record<CalendarEventPriority, string> = {
  0: 'success',   // Verde - Bajo
  1: 'warning',   // Amarillo - Medio
  2: 'error'      // Rojo - Alto
}

export const STATUS_LABELS: Record<CalendarEventStatus, string> = {
  'PENDIENTE': 'Pendiente',
  'PROGRESO': 'En Progreso',
  'COMPLETADO': 'Completado'
}

export const STATUS_COLORS: Record<CalendarEventStatus, string> = {
  'PENDIENTE': 'warning',
  'PROGRESO': 'info',
  'COMPLETADO': 'success'
}

// ============================================
// INTERFACES BASADAS EN TABLAS
// ============================================

/**
 * Tabla: calendars
 * Calendario principal de un usuario
 */
export interface Calendar {
  id: number
  user_id: number
  created_at?: string
  updated_at?: string
}

/**
 * Tabla: calendar_events
 * Evento/Actividad principal
 */
export interface CalendarEventBase {
  id: number
  calendar_id: number
  priority: CalendarEventPriority
  name: string
  contenedor_id?: number | null
  notes?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

/**
 * Tabla: calendar_event_days
 * Días asociados a un evento (rango de fechas)
 */
export interface CalendarEventDay {
  id: number
  calendar_id: number
  calendar_event_id: number
  date: string // YYYY-MM-DD
  created_at?: string
  updated_at?: string
}

/**
 * Tabla: calendar_event_charges
 * Asignación de responsables a un evento
 */
export interface CalendarEventCharge {
  id: number
  calendar_id: number
  user_id: number
  calendar_event_id: number
  notes?: string | null
  assigned_at?: string | null
  removed_at?: string | null
  status: CalendarEventStatus
  created_at?: string
  updated_at?: string
  // Datos extendidos del usuario (join)
  user?: CalendarResponsable
}

/**
 * Tabla: calendar_event_charge_tracking
 * Historial de cambios de estado
 */
export interface CalendarEventChargeTracking {
  id: number
  calendar_event_charge_id: number
  from_status?: CalendarEventStatus | null
  to_status: CalendarEventStatus
  changed_at: string
  changed_by?: number | null
  // Datos extendidos (joins)
  changed_by_user?: CalendarResponsable | null
  charge?: CalendarEventCharge | null
}

/**
 * Tabla: calendar_user_color_config
 * Configuración de colores por usuario
 */
export interface CalendarUserColorConfig {
  id: number
  calendar_id: number
  user_id: number
  color_code: string // Hex, ej. #RRGGBB
  created_at?: string
  updated_at?: string
  // Datos extendidos del usuario (join)
  user?: CalendarResponsable
}

// ============================================
// INTERFACES EXTENDIDAS (CON JOINS)
// ============================================

/**
 * Responsable/Usuario simplificado para el calendario
 */
export interface CalendarResponsable {
  id: number
  nombre: string
  email?: string
  avatar?: string | null
  color?: string // Del color_config
}

/**
 * Contenedor/Consolidado simplificado
 */
export interface CalendarContenedor {
  id: number
  nombre: string
  codigo?: string
}

/**
 * Evento completo con todas las relaciones
 * (respuesta típica del backend)
 */
export interface CalendarEvent {
  id: number
  calendar_id: number
  priority: CalendarEventPriority
  name: string
  contenedor_id?: number | null
  notes?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  // Relaciones
  days: CalendarEventDay[]
  charges: CalendarEventCharge[]
  contenedor?: CalendarContenedor | null
  // Campos calculados para UI
  start_date?: string // Primera fecha de days
  start_time?: string // Hora de inicio (HH:mm)
  end_time?: string   // Hora de fin (HH:mm)
  is_all_day?: boolean // Todo el día
  is_for_me?: boolean
  is_public?: boolean
  role_id?: number | null
  role_name?: string | null
  created_by?: number
  created_by_name?: string
  description?: string
  end_date?: string   // Última fecha de days
  duration?: number   // Días entre start_date y end_date
  responsables?: CalendarResponsable[]
  // Campos legacy para compatibilidad
  title?: string // Alias de name
  color?: string // Color del primer responsable
  type?: 'evento' | 'tarea'
  task_day_id?: number | null
}

// ============================================
// REQUESTS
// ============================================

/**
 * Request para crear una actividad
 */
export interface CreateCalendarEventRequest {
  name: string
  priority?: CalendarEventPriority
  contenedor_id?: number | null
  notes?: string | null
  start_date: string // YYYY-MM-DD
  end_date: string   // YYYY-MM-DD
  responsable_ids?: number[] // Array de 1 o 2 user_ids
}

/**
 * Request para actualizar una actividad
 */
export interface UpdateCalendarEventRequest extends Partial<CreateCalendarEventRequest> {
  id: number
}

/**
 * Request para actualizar el estado de un charge (responsable)
 */
export interface UpdateChargeStatusRequest {
  charge_id: number
  status: CalendarEventStatus
}

/**
 * Request para actualizar la prioridad de un evento
 */
export interface UpdateEventPriorityRequest {
  event_id: number
  priority: CalendarEventPriority
}

/**
 * Request para agregar/actualizar nota de un charge
 */
export interface UpdateChargeNotesRequest {
  charge_id: number
  notes: string
}

/**
 * Request para configurar color de usuario
 */
export interface UpdateUserColorRequest {
  user_id: number
  color_code: string
}

// ============================================
// FILTROS
// ============================================

export interface CalendarFilters {
  start_date?: string
  end_date?: string
  responsable_id?: number
  contenedor_id?: number
  /** Varios consolidados (ej. en vista progreso). El backend acepta contenedor_ids[] */
  contenedor_ids?: number[]
  status?: CalendarEventStatus
  priority?: CalendarEventPriority
}

// ============================================
// RESPONSES
// ============================================

export interface CalendarResponse<T = CalendarEvent[]> {
  success: boolean
  data: T
  message?: string
}

export interface CalendarEventResponse {
  success: boolean
  data: CalendarEvent
  message?: string
}

/**
 * Respuesta de responsables disponibles
 */
export interface ResponsablesResponse {
  success: boolean
  data: CalendarResponsable[]
  message?: string
}

/**
 * Respuesta de configuración de colores
 */
export interface ColorConfigResponse {
  success: boolean
  data: CalendarUserColorConfig[]
  message?: string
}

/**
 * Respuesta de contenedores para filtro
 */
export interface ContenedoresResponse {
  success: boolean
  data: CalendarContenedor[]
  message?: string
}

/**
 * Respuesta de tracking/historial de cambios de estado
 */
export interface ChargeTrackingResponse {
  success: boolean
  data: CalendarEventChargeTracking[]
  message?: string
}

// ============================================
// PROGRESO (ESTADÍSTICAS)
// ============================================

/**
 * Estadísticas de progreso del equipo
 */
export interface TeamProgress {
  total_actividades: number
  completadas: number
  en_progreso: number
  pendientes: number
  porcentaje_completado: number
}

/**
 * Estadísticas de progreso por responsable
 */
export interface ResponsableProgress {
  user_id: number
  nombre: string
  color?: string
  total_asignadas: number
  completadas: number
  en_progreso: number
  pendientes: number
  porcentaje_completado: number
}

export interface ProgressResponse {
  success: boolean
  data: {
    team: TeamProgress
    by_responsable: ResponsableProgress[]
  }
  message?: string
}

// ============================================
// LEGACY INTERFACES (para compatibilidad)
// ============================================

export interface CreateEventRequest {
  title: string
  description?: string
  start_date: string
  end_date: string
  start_time?: string
  end_time?: string
  is_all_day?: boolean
  is_for_me?: boolean
  is_for_my_role?: boolean
  is_public?: boolean
  type?: 'evento' | 'tarea'
}

export interface UpdateEventRequest extends CreateEventRequest {
  id: number
  task_day_id?: number | null
}

export interface MoveEventRequest {
  id: number
  start_date: string
  end_date: string
  start_time?: string
  end_time?: string
}
