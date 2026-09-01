import { BaseService } from '~/services/base/BaseService'
import type {
  SoporteTiActualizarEstadoPayload,
  SoporteTiCambiarEstadoPayload,
  SoporteTiCreadorFiltro,
  SoporteTiCreatePayload,
  SoporteTiEnviarMensajePayload,
  SoporteTiListFilters,
  SoporteTiListStats,
  SoporteTiMensaje,
  SoporteTiMensajeInfoLectura,
  SoporteTiSolicitud,
  SoporteTiEstado,
  SoporteTiEstadoHistorial,
  SoporteTiArea,
  SoporteTiAreaCatalogo,
  SoporteTiAreaGestion
} from '~/types/soporteTi'
import type {
  SoporteTiCreadoresResponseRaw,
  SoporteTiFaseHorasAMatrizApi,
  SoporteTiListResponseRaw,
  SoporteTiMensajeApi,
  SoporteTiMensajeInfoLecturaApi,
  SoporteTiMensajesResponseRaw,
  SoporteTiSingleResponseRaw,
  SoporteTiSlaHorasApi,
  SoporteTiWsEstadoPayload,
  SoporteTiWsMensajePayload,
  SoporteTiWsMensajesLeidosPayload,
  SoporteTiWsSolicitudCreadaPayload
} from '~/services/soporteTi/apiTypes'
import {
  adaptCreadoresFiltro,
  adaptEstado,
  adaptHistorial,
  adaptListResponse,
  adaptMensaje,
  adaptMensajeInfo,
  adaptSolicitud,
  adaptWsEstado,
  adaptWsMensaje,
  toCreateFormData,
  toUpdateBody
} from '~/services/soporteTi/adapt'
import { SOPORTE_TI_CHAT_PAGE_SIZE } from '~/constants/soporteTi'

const BASE = '/api/soporte-ti/solicitudes'

function appendSoporteTiListFilters(
  q: URLSearchParams,
  filters?: SoporteTiListFilters,
  opts?: { omitCreador?: boolean }
) {
  if (filters?.q) q.set('q', filters.q)
  if (filters?.tipo && filters.tipo !== 'todos') q.set('tipo_solicitud', filters.tipo)
  if (filters?.estadoCodigo && filters.estadoCodigo !== 'todos') {
    q.set('estado_codigo', filters.estadoCodigo)
  }
  if (filters?.prioridad != null && filters.prioridad > 0) {
    q.set('prioridad', String(filters.prioridad))
  }
  if (filters?.soloMias) q.set('solo_mias', '1')
  if (
    !opts?.omitCreador &&
    filters?.creadorUserId != null &&
    filters.creadorUserId > 0
  ) {
    q.set('creador_user_id', String(filters.creadorUserId))
  }
}

export type SoporteTiListResult = {
  success: boolean
  data: SoporteTiSolicitud[]
  resumen?: SoporteTiListStats
  message?: string
}

export type SoporteTiCreadoresListResult = {
  success: boolean
  data: SoporteTiCreadorFiltro[]
  message?: string
}

export type SoporteTiSolicitudResult = {
  success: boolean
  data?: SoporteTiSolicitud
  message?: string
}

export type SoporteTiMensajesResult = {
  success: boolean
  data: SoporteTiMensaje[]
  pagination: {
    hasMore: boolean
    oldestId: number | null
    newestId: number | null
    perPage: number
  }
  message?: string
}

export class SoporteTiService extends BaseService {
  /** Adapta payload WS de mensaje → UI tipado. */
  static adaptWsMensaje(p: SoporteTiWsMensajePayload) {
    return adaptWsMensaje(p)
  }

  static adaptWsEstado(p: SoporteTiWsEstadoPayload) {
    return adaptWsEstado(p)
  }

  static adaptWsMensajesLeidos(p: SoporteTiWsMensajesLeidosPayload) {
    return {
      chatUuid: p.chat_uuid,
      codigo: p.codigo,
      lectorUsuarioId: p.lector_usuario_id,
      mensajeIds: p.mensaje_ids
    }
  }

  static adaptWsSolicitudCreada(p: SoporteTiWsSolicitudCreadaPayload): SoporteTiSolicitud | null {
    if (!p?.solicitud) return null
    return adaptSolicitud(p.solicitud)
  }

  static async list(filters?: SoporteTiListFilters): Promise<SoporteTiListResult> {
    const q = new URLSearchParams()
    appendSoporteTiListFilters(q, filters)
    const qs = q.toString()
    const raw = await this.apiCall<SoporteTiListResponseRaw>(qs ? `${BASE}?${qs}` : BASE)
    return adaptListResponse(raw)
  }

  static async listCreadores(
    filters?: SoporteTiListFilters
  ): Promise<SoporteTiCreadoresListResult> {
    const q = new URLSearchParams()
    appendSoporteTiListFilters(q, filters, { omitCreador: true })
    const qs = q.toString()
    const raw = await this.apiCall<SoporteTiCreadoresResponseRaw>(
      qs ? `${BASE}/creadores?${qs}` : `${BASE}/creadores`
    )
    return {
      success: raw.success,
      data: adaptCreadoresFiltro(raw.data),
      message: raw.message
    }
  }

  static async show(id: number): Promise<SoporteTiSolicitudResult> {
    const raw = await this.apiCall<SoporteTiSingleResponseRaw>(`${BASE}/${id}`)
    return {
      success: raw.success,
      data: raw.data ? adaptSolicitud(raw.data) : undefined,
      message: raw.message
    }
  }

  static async store(payload: SoporteTiCreatePayload): Promise<SoporteTiSolicitudResult> {
    const raw = await this.apiCall<SoporteTiSingleResponseRaw>(BASE, {
      method: 'POST',
      body: toCreateFormData(payload) as unknown as Record<string, unknown>
    })
    return {
      success: raw.success,
      data: raw.data ? adaptSolicitud(raw.data) : undefined,
      message: raw.message
    }
  }

  static async update(
    id: number,
    patch: Partial<SoporteTiSolicitud>
  ): Promise<SoporteTiSolicitudResult> {
    const raw = await this.apiCall<SoporteTiSingleResponseRaw>(`${BASE}/${id}`, {
      method: 'PUT',
      body: toUpdateBody(patch)
    })
    return {
      success: raw.success,
      data: raw.data ? adaptSolicitud(raw.data) : undefined,
      message: raw.message
    }
  }

  static async destroy(id: number): Promise<{ success: boolean; message?: string }> {
    return this.apiCall(`${BASE}/${id}`, { method: 'DELETE' })
  }

  static async updatePrioridad(id: number, prioridad: number): Promise<SoporteTiSolicitudResult> {
    const raw = await this.apiCall<SoporteTiSingleResponseRaw>(`${BASE}/${id}/prioridad`, {
      method: 'PATCH',
      body: { prioridad }
    })
    return {
      success: raw.success,
      data: raw.data ? adaptSolicitud(raw.data) : undefined,
      message: raw.message
    }
  }

  static async updateComplejidad(
    id: number,
    criticidad: string
  ): Promise<SoporteTiSolicitudResult> {
    const raw = await this.apiCall<SoporteTiSingleResponseRaw>(`${BASE}/${id}/complejidad`, {
      method: 'PATCH',
      body: { criticidad }
    })
    return {
      success: raw.success,
      data: raw.data ? adaptSolicitud(raw.data) : undefined,
      message: raw.message
    }
  }

  static async updateAsignacion(
    id: number,
    body: { pmUserId?: number | null; analistaUserId?: number | null }
  ): Promise<SoporteTiSolicitudResult> {
    const raw = await this.apiCall<SoporteTiSingleResponseRaw>(`${BASE}/${id}/asignacion`, {
      method: 'PATCH',
      body: {
        pm_user_id: body.pmUserId ?? null,
        analista_user_id: body.analistaUserId ?? null
      }
    })
    return {
      success: raw.success,
      data: raw.data ? adaptSolicitud(raw.data) : undefined,
      message: raw.message
    }
  }

  static async listStaff(): Promise<{
    success: boolean
    data: Array<{ id: number; nombre: string; rol: string }>
  }> {
    return this.apiCall('/api/soporte-ti/staff')
  }

  static async updateEstado(
    id: number,
    payload: SoporteTiActualizarEstadoPayload
  ): Promise<SoporteTiSolicitudResult> {
    const body: Record<string, unknown> = {}
    if (payload.estadoCodigo != null) body.estado_codigo = payload.estadoCodigo
    if (payload.estadoId != null) body.estado_id = payload.estadoId
    if (payload.comentario != null) body.comentario = payload.comentario
    const raw = await this.apiCall<SoporteTiSingleResponseRaw>(`${BASE}/${id}/estado`, {
      method: 'PATCH',
      body
    })
    return {
      success: raw.success,
      data: raw.data ? adaptSolicitud(raw.data) : undefined,
      message: raw.message
    }
  }

  static async postMensaje(
    id: number,
    payload: SoporteTiEnviarMensajePayload
  ): Promise<{ success: boolean; data?: SoporteTiMensaje; message?: string }> {
    const tieneArchivos = (payload.imagenes?.length ?? 0) > 0
    let raw: { success: boolean; data?: import('~/services/soporteTi/apiTypes').SoporteTiMensajeApi; message?: string }
    if (tieneArchivos) {
      const fd = new FormData()
      fd.append('texto', payload.texto)
      if (payload.replyToId != null) fd.append('reply_to_id', String(payload.replyToId))
      payload.imagenes!.forEach((file, i) => fd.append(`imagenes[${i}]`, file))
      raw = await this.apiCall(`${BASE}/${id}/mensajes`, { method: 'POST', body: fd })
    } else {
      raw = await this.apiCall(`${BASE}/${id}/mensajes`, {
        method: 'POST',
        body: {
          texto: payload.texto,
          reply_to_id: payload.replyToId ?? null
        }
      })
    }
    return {
      success: raw.success,
      data: raw.data ? adaptMensaje(raw.data) : undefined,
      message: raw.message
    }
  }

  static async marcarLeidos(
    chatUuid: string,
    mensajeIds: number[]
  ): Promise<{ success: boolean; queued?: number; mensajeIds?: number[]; message?: string }> {
    const raw = await this.apiCall<{
      success: boolean
      queued?: number
      mensaje_ids?: number[]
      message?: string
    }>(`/api/soporte-ti/chats/${chatUuid}/mensajes/leidos`, {
      method: 'POST',
      body: { mensaje_ids: mensajeIds }
    })
    return {
      success: raw.success,
      queued: raw.queued,
      mensajeIds: raw.mensaje_ids,
      message: raw.message
    }
  }

  static async infoMensaje(
    chatUuid: string,
    mensajeId: number
  ): Promise<{ success: boolean; data?: SoporteTiMensajeInfoLectura; message?: string }> {
    const raw = await this.apiCall<{
      success: boolean
      data?: SoporteTiMensajeInfoLecturaApi
      message?: string
    }>(`/api/soporte-ti/chats/${chatUuid}/mensajes/${mensajeId}/info`)
    return {
      success: raw.success,
      data: raw.data ? adaptMensajeInfo(raw.data) : undefined,
      message: raw.message
    }
  }

  static async getMensajes(
    chatUuid: string,
    query: { limit?: number; beforeId?: number | null } = {}
  ): Promise<SoporteTiMensajesResult> {
    const q = new URLSearchParams()
    q.set('limit', String(query.limit ?? SOPORTE_TI_CHAT_PAGE_SIZE))
    if (query.beforeId != null) q.set('before_id', String(query.beforeId))
    const raw = await this.apiCall<SoporteTiMensajesResponseRaw>(
      `/api/soporte-ti/chats/${chatUuid}/mensajes?${q.toString()}`
    )
    return {
      success: raw.success,
      data: (raw.data ?? []).map(adaptMensaje),
      pagination: {
        hasMore: raw.pagination?.has_more ?? false,
        oldestId: raw.pagination?.oldest_id ?? null,
        newestId: raw.pagination?.newest_id ?? null,
        perPage: raw.pagination?.per_page ?? SOPORTE_TI_CHAT_PAGE_SIZE
      },
      message: raw.message
    }
  }

  static async postMaqueta(id: number, formData: FormData): Promise<SoporteTiSolicitudResult> {
    const raw = await this.apiCall<SoporteTiSingleResponseRaw>(`${BASE}/${id}/maqueta`, {
      method: 'POST',
      body: formData
    })
    return {
      success: raw.success,
      data: raw.data ? adaptSolicitud(raw.data) : undefined,
      message: raw.message
    }
  }

  static async getSlaHoras(
    tipo: 'B' | 'A' = 'B',
    ambito?: 'pm_fases' | 'analista_config'
  ): Promise<{ success: boolean; data?: SoporteTiSlaHorasApi[]; message?: string }> {
    const q = new URLSearchParams()
    q.set('tipo', tipo)
    if (tipo === 'A' && ambito) q.set('ambito', ambito)
    return this.apiCall(`/api/soporte-ti/sla-horas?${q.toString()}`)
  }

  static async updateSlaHoras(
    tipo: 'B' | 'A',
    horas: Array<{ id: number; horas: number }>,
    ambito?: 'pm_fases' | 'analista_config'
  ): Promise<{ success: boolean; data?: SoporteTiSlaHorasApi[]; message?: string }> {
    const q = new URLSearchParams()
    q.set('tipo', tipo)
    if (tipo === 'A' && ambito) q.set('ambito', ambito)
    return this.apiCall(`/api/soporte-ti/sla-horas?${q.toString()}`, {
      method: 'PUT',
      body: { tipo, horas, ambito: tipo === 'A' ? ambito : undefined }
    })
  }

  static async getFaseHorasA(): Promise<{
    success: boolean
    data?: SoporteTiFaseHorasAMatrizApi
    message?: string
  }> {
    return this.apiCall('/api/soporte-ti/fase-horas-a')
  }

  static async updateFaseHorasA(
    horas: Array<{ id: number; horas: number }>
  ): Promise<{
    success: boolean
    data?: SoporteTiFaseHorasAMatrizApi
    message?: string
  }> {
    return this.apiCall('/api/soporte-ti/fase-horas-a', {
      method: 'PUT',
      body: { horas }
    })
  }

  static async listEstados(): Promise<{ success: boolean; data: SoporteTiEstado[] }> {
    const raw = await this.apiCall<{
      success: boolean
      data: import('~/services/soporteTi/apiTypes').SoporteTiEstadoApi[]
    }>('/api/soporte-ti/estados')
    return {
      success: raw.success,
      data: (raw.data ?? []).map(adaptEstado)
    }
  }

  static async transition(
    id: number,
    payload: SoporteTiCambiarEstadoPayload
  ): Promise<SoporteTiSolicitudResult & { historial?: SoporteTiEstadoHistorial }> {
    const raw = await this.apiCall<
      SoporteTiSingleResponseRaw & {
        historial?: import('~/services/soporteTi/apiTypes').SoporteTiEstadoHistorialApi
      }
    >(`${BASE}/${id}/estado`, {
      method: 'POST',
      body: {
        estado_id: payload.estadoId,
        comentario: payload.comentario ?? null
      }
    })
    return {
      success: raw.success,
      data: raw.data ? adaptSolicitud(raw.data) : undefined,
      message: raw.message,
      historial: raw.historial ? adaptHistorial(raw.historial) : undefined
    }
  }

  static async historialEstados(
    id: number
  ): Promise<{ success: boolean; data: SoporteTiEstadoHistorial[] }> {
    const raw = await this.apiCall<{
      success: boolean
      data: import('~/services/soporteTi/apiTypes').SoporteTiEstadoHistorialApi[]
    }>(`${BASE}/${id}/estados/historial`)
    return {
      success: raw.success,
      data: (raw.data ?? []).map(adaptHistorial)
    }
  }

  static async catalogoAreas(): Promise<{
    success: boolean
    data?: SoporteTiAreaCatalogo
    message?: string
  }> {
    return this.apiCall('/api/soporte-ti/areas/catalogo')
  }

  static async listarAreasGestion(): Promise<{
    success: boolean
    data?: SoporteTiAreaGestion
    message?: string
  }> {
    return this.apiCall('/api/soporte-ti/areas')
  }

  static async crearArea(payload: {
    nombre: string
    orden?: number
    activo?: boolean
    grupo_ids: number[]
  }): Promise<{ success: boolean; data?: SoporteTiArea; message?: string }> {
    return this.apiCall('/api/soporte-ti/areas', { method: 'POST', body: payload })
  }

  static async actualizarArea(
    id: number,
    payload: {
      nombre?: string
      orden?: number
      activo?: boolean
      grupo_ids?: number[]
    }
  ): Promise<{ success: boolean; data?: SoporteTiArea; message?: string }> {
    return this.apiCall(`/api/soporte-ti/areas/${id}`, { method: 'PUT', body: payload })
  }

  static async eliminarArea(
    id: number
  ): Promise<{ success: boolean; data?: { desactivada: boolean }; message?: string }> {
    return this.apiCall(`/api/soporte-ti/areas/${id}`, { method: 'DELETE' })
  }
}

/** Re-export wire WS types for room subscription only. */
export type {
  SoporteTiWsMensajePayload,
  SoporteTiWsMensajesLeidosPayload,
  SoporteTiWsEstadoPayload
}
