import { BaseService } from "../base/BaseService"
import type {
  ApiMessageResponse,
  ApiResponse,
  CalendarActivityCatalogExtras,
  CalendarActivityCatalogItem,
  CalendarConfig,
  CalendarConsolidadoColorConfig,
  CalendarContenedor,
  CalendarEventApi,
  CalendarEventPriority,
  CalendarEventsResponse,
  CalendarEventStatus,
  CalendarFilters,
  CalendarIntranetUser,
  CalendarMyRoleGroup,
  CalendarProgress,
  CalendarResponsable,
  CalendarRoleGroup,
  CalendarRoleGroupConfig,
  CalendarRoleGroupConfigPayload,
  CalendarRoleGroupMember,
  CalendarRoleGroupMemberRecord,
  CalendarRoleGroupPayload,
  CalendarRoleType,
  CalendarSubtask,
  CalendarUserColorConfig,
  CreateCalendarEventRequest,
  CreateSubtaskRequest,
  UpdateCalendarEventRequest,
  UpdateSubtaskRequest
} from "~/types/calendar"

type QueryValue = string | number | number[] | undefined | null

/** Query string para GET; los arrays se envían como key[]=val para que Laravel los reciba como array. */
const buildQueryString = (params?: Record<string, QueryValue>): string => {
  if (!params) return ''
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      value.forEach(v => search.append(`${key}[]`, String(v)))
    } else {
      search.append(key, String(value))
    }
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export class CalendarService extends BaseService {
  private static baseUrl = 'api/calendar'

  // ============================================
  // CONFIGURACIÓN Y GRUPOS
  // ============================================

  /** Configuración del usuario en el grupo indicado (o en su primer grupo). */
  static async getCalendarConfig(roleGroupId?: number | null): Promise<CalendarConfig> {
    const qs = buildQueryString({ role_group_id: roleGroupId })
    const response = await this.apiCall<ApiResponse<CalendarConfig>>(`${this.baseUrl}/config${qs}`, { method: 'GET' })
    return response.data
  }

  /** Grupos a los que pertenece el usuario autenticado, con su rol en cada uno. */
  static async getMyRoleGroups(): Promise<CalendarMyRoleGroup[]> {
    const response = await this.apiCall<ApiResponse<CalendarMyRoleGroup[]>>(`${this.baseUrl}/my-role-groups`, { method: 'GET' })
    return response.data
  }

  /** Usuarios de la intranet para agregar a grupos (máx. 250). */
  static async getIntranetUsers(search = ''): Promise<CalendarIntranetUser[]> {
    const qs = buildQueryString({ search: search.trim() })
    const response = await this.apiCall<ApiResponse<CalendarIntranetUser[]>>(`${this.baseUrl}/users${qs}`, { method: 'GET' })
    return response.data ?? []
  }

  static async createRoleGroup(body: CalendarRoleGroupPayload): Promise<CalendarRoleGroup> {
    const response = await this.apiCall<ApiResponse<CalendarRoleGroup>>(`${this.baseUrl}/role-groups`, { method: 'POST', body })
    return response.data
  }

  static async updateRoleGroup(id: number, body: CalendarRoleGroupPayload): Promise<CalendarRoleGroup> {
    const response = await this.apiCall<ApiResponse<CalendarRoleGroup>>(`${this.baseUrl}/role-groups/${id}`, { method: 'PUT', body })
    return response.data
  }

  static async deleteRoleGroup(id: number): Promise<ApiMessageResponse> {
    return this.apiCall<ApiMessageResponse>(`${this.baseUrl}/role-groups/${id}`, { method: 'DELETE' })
  }

  static async getRoleGroupMembers(id: number): Promise<CalendarRoleGroupMember[]> {
    const response = await this.apiCall<ApiResponse<CalendarRoleGroupMember[]>>(`${this.baseUrl}/role-groups/${id}/members`, { method: 'GET' })
    return response.data
  }

  static async addRoleGroupMember(id: number, body: { user_id: number; role_type: CalendarRoleType }): Promise<CalendarRoleGroupMemberRecord> {
    const response = await this.apiCall<ApiResponse<CalendarRoleGroupMemberRecord>>(`${this.baseUrl}/role-groups/${id}/members`, { method: 'POST', body })
    return response.data
  }

  static async removeRoleGroupMember(id: number, memberId: number): Promise<ApiMessageResponse> {
    return this.apiCall<ApiMessageResponse>(`${this.baseUrl}/role-groups/${id}/members/${memberId}`, { method: 'DELETE' })
  }

  static async getRoleGroupConfig(id: number): Promise<CalendarRoleGroupConfig | null> {
    const response = await this.apiCall<ApiResponse<CalendarRoleGroupConfig | null>>(`${this.baseUrl}/role-groups/${id}/config`, { method: 'GET' })
    return response.data
  }

  static async updateRoleGroupConfig(id: number, body: CalendarRoleGroupConfigPayload): Promise<CalendarRoleGroupConfig> {
    const response = await this.apiCall<ApiResponse<CalendarRoleGroupConfig>>(`${this.baseUrl}/role-groups/${id}/config`, { method: 'PUT', body })
    return response.data
  }

  // ============================================
  // EVENTOS / ACTIVIDADES
  // ============================================

  /** Con page y per_page la respuesta incluye meta, my_progress y global_progress. */
  static async getEvents(filters?: CalendarFilters): Promise<CalendarEventsResponse> {
    const qs = buildQueryString(filters ? { ...filters } : undefined)
    return this.apiCall<CalendarEventsResponse>(`${this.baseUrl}/events${qs}`, { method: 'GET' })
  }

  /** Orden manual de eventos en la vista mes (drag & drop). */
  static async reorderEvents(ids: number[]): Promise<ApiMessageResponse> {
    return this.apiCall<ApiMessageResponse>(`${this.baseUrl}/events/reorder`, { method: 'POST', body: { ids } })
  }

  static async createActivity(data: CreateCalendarEventRequest): Promise<CalendarEventApi> {
    const response = await this.apiCall<ApiResponse<CalendarEventApi>>(`${this.baseUrl}/activities`, { method: 'POST', body: data })
    return response.data
  }

  static async updateActivity(data: UpdateCalendarEventRequest): Promise<CalendarEventApi> {
    const response = await this.apiCall<ApiResponse<CalendarEventApi>>(`${this.baseUrl}/activities/${data.id}`, { method: 'PUT', body: data })
    return response.data
  }

  /** Soft delete. */
  static async deleteActivity(id: number): Promise<ApiMessageResponse> {
    return this.apiCall<ApiMessageResponse>(`${this.baseUrl}/activities/${id}`, { method: 'DELETE' })
  }

  // ============================================
  // ESTADO, PRIORIDAD Y NOTAS
  // ============================================

  /** Estado de un responsable. Jefe: cualquiera; miembro: solo el suyo. */
  static async updateChargeStatus(chargeId: number, status: CalendarEventStatus): Promise<ApiMessageResponse> {
    return this.apiCall<ApiMessageResponse>(`${this.baseUrl}/charges/${chargeId}/status`, { method: 'PUT', body: { status } })
  }

  /** Estado de toda la actividad (todos los responsables). Solo jefe del grupo. */
  static async updateEventStatus(eventId: number, status: CalendarEventStatus): Promise<CalendarEventApi> {
    const response = await this.apiCall<ApiResponse<CalendarEventApi>>(`${this.baseUrl}/events/${eventId}/status`, { method: 'PUT', body: { status } })
    return response.data
  }

  static async updateEventPriority(eventId: number, priority: CalendarEventPriority): Promise<ApiMessageResponse> {
    return this.apiCall<ApiMessageResponse>(`${this.baseUrl}/activities/${eventId}/priority`, { method: 'PUT', body: { priority } })
  }

  static async updateChargeNotes(chargeId: number, notes: string): Promise<ApiMessageResponse> {
    return this.apiCall<ApiMessageResponse>(`${this.baseUrl}/charges/${chargeId}/notes`, { method: 'PUT', body: { notes } })
  }

  static async updateEventNotes(eventId: number, notes: string): Promise<ApiMessageResponse> {
    return this.apiCall<ApiMessageResponse>(`${this.baseUrl}/activities/${eventId}/notes`, { method: 'PUT', body: { notes } })
  }

  // ============================================
  // SUBTAREAS
  // ============================================

  static async createSubtask(chargeId: number, body: CreateSubtaskRequest): Promise<CalendarSubtask> {
    const response = await this.apiCall<ApiResponse<CalendarSubtask>>(`${this.baseUrl}/charges/${chargeId}/subtasks`, { method: 'POST', body })
    return response.data
  }

  static async updateSubtask(subtaskId: number, body: UpdateSubtaskRequest): Promise<CalendarSubtask> {
    const response = await this.apiCall<ApiResponse<CalendarSubtask>>(`${this.baseUrl}/subtasks/${subtaskId}`, { method: 'PUT', body })
    return response.data
  }

  static async deleteSubtask(subtaskId: number): Promise<ApiMessageResponse> {
    return this.apiCall<ApiMessageResponse>(`${this.baseUrl}/subtasks/${subtaskId}`, { method: 'DELETE' })
  }

  // ============================================
  // RESPONSABLES, CONSOLIDADOS Y COLORES
  // ============================================

  /** Miembros activos del grupo indicado (o del primer grupo del usuario). */
  static async getResponsables(roleGroupId?: number | null): Promise<CalendarResponsable[]> {
    const qs = buildQueryString({ role_group_id: roleGroupId })
    const response = await this.apiCall<ApiResponse<CalendarResponsable[]>>(`${this.baseUrl}/responsables${qs}`, { method: 'GET' })
    return response.data
  }

  /** Consolidados no cerrados en documentación. */
  static async getContenedores(): Promise<CalendarContenedor[]> {
    const response = await this.apiCall<ApiResponse<CalendarContenedor[]>>(`${this.baseUrl}/contenedores`, { method: 'GET' })
    return response.data
  }

  static async getColorConfig(): Promise<CalendarUserColorConfig[]> {
    const response = await this.apiCall<ApiResponse<CalendarUserColorConfig[]>>(`${this.baseUrl}/colors`, { method: 'GET' })
    return response.data
  }

  static async updateUserColor(userId: number, colorCode: string): Promise<ApiMessageResponse> {
    return this.apiCall<ApiMessageResponse>(`${this.baseUrl}/colors`, { method: 'PUT', body: { user_id: userId, color_code: colorCode } })
  }

  static async getConsolidadoColorConfig(): Promise<CalendarConsolidadoColorConfig[]> {
    const response = await this.apiCall<ApiResponse<CalendarConsolidadoColorConfig[]>>(`${this.baseUrl}/consolidado-colors`, { method: 'GET' })
    return response.data
  }

  /** Guarda varios colores de consolidado en una sola petición. */
  static async updateConsolidadoColors(items: { contenedor_id: number; color_code: string }[]): Promise<ApiMessageResponse> {
    return this.apiCall<ApiMessageResponse>(`${this.baseUrl}/consolidado-colors`, { method: 'PUT', body: { items } })
  }

  // ============================================
  // CATÁLOGO DE ACTIVIDADES
  // ============================================

  static async getActivityCatalog(roleGroupId: number): Promise<CalendarActivityCatalogItem[]> {
    const qs = buildQueryString({ role_group_id: roleGroupId })
    const response = await this.apiCall<ApiResponse<CalendarActivityCatalogItem[]>>(`${this.baseUrl}/activity-catalog${qs}`, { method: 'GET' })
    return response.data
  }

  static async createActivityCatalog(name: string, roleGroupId: number): Promise<CalendarActivityCatalogItem> {
    const response = await this.apiCall<ApiResponse<CalendarActivityCatalogItem>>(`${this.baseUrl}/activity-catalog`, {
      method: 'POST',
      body: { name, role_group_id: roleGroupId }
    })
    return response.data
  }

  /**
   * colorCode: undefined = no tocar el color; null = quitarlo.
   */
  static async updateActivityCatalog(
    id: number,
    name: string,
    roleGroupId: number,
    colorCode?: string | null,
    extras?: CalendarActivityCatalogExtras
  ): Promise<CalendarActivityCatalogItem> {
    const body: Record<string, string | number | boolean | null> = { name, role_group_id: roleGroupId }
    if (colorCode !== undefined) body.color_code = colorCode || null
    if (extras?.allow_saturday !== undefined) body.allow_saturday = extras.allow_saturday
    if (extras?.allow_sunday !== undefined) body.allow_sunday = extras.allow_sunday
    if (extras?.default_priority !== undefined) body.default_priority = extras.default_priority
    const response = await this.apiCall<ApiResponse<CalendarActivityCatalogItem>>(`${this.baseUrl}/activity-catalog/${id}`, { method: 'PUT', body })
    return response.data
  }

  static async reorderActivityCatalog(ids: number[], roleGroupId: number): Promise<ApiMessageResponse> {
    return this.apiCall<ApiMessageResponse>(`${this.baseUrl}/activity-catalog/reorder`, {
      method: 'POST',
      body: { ids, role_group_id: roleGroupId }
    })
  }

  /** Falla con 400 si la actividad está en uso por algún evento. */
  static async deleteActivityCatalog(id: number, roleGroupId: number): Promise<ApiMessageResponse> {
    const qs = buildQueryString({ role_group_id: roleGroupId })
    return this.apiCall<ApiMessageResponse>(`${this.baseUrl}/activity-catalog/${id}${qs}`, { method: 'DELETE' })
  }

  // ============================================
  // PROGRESO
  // ============================================

  /** Solo jefe (canViewTeamProgress). */
  static async getProgress(filters?: CalendarFilters): Promise<CalendarProgress> {
    const qs = buildQueryString(filters ? { ...filters } : undefined)
    const response = await this.apiCall<ApiResponse<CalendarProgress>>(`${this.baseUrl}/progress${qs}`, { method: 'GET' })
    return response.data
  }
}
