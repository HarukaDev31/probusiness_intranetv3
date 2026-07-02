import { BaseService } from './base/BaseService'
import type {
  SoporteTiListResponse,
  SoporteTiSingleResponse,
  SoporteTiMutationResponse,
  SoporteTiListFilters,
  SoporteTiSolicitudApi,
  SoporteTiMensajeApi,
  SoporteTiEnviarMensajePayload,
  SoporteTiCambiarEstadoPayload,
  SoporteTiActualizarEstadoPayload,
  SoporteTiEstadoApi,
  SoporteTiEstadoHistorialApi,
  SoporteTiMensajesPaginatedResponse,
  SoporteTiMensajesQuery,
  SoporteTiSlaHorasApi,
  SoporteTiFaseHorasAMatrizApi
} from '~/types/soporteTi'
import { SOPORTE_TI_CHAT_PAGE_SIZE } from '~/constants/soporteTi'

const BASE = '/api/soporte-ti/solicitudes'

export class SoporteTiService extends BaseService {
  static async list(filters?: SoporteTiListFilters): Promise<SoporteTiListResponse> {
    const q = new URLSearchParams()
    if (filters?.q) q.set('q', filters.q)
    if (filters?.tipo && filters.tipo !== 'todos') q.set('tipo_solicitud', filters.tipo)
    const qs = q.toString()
    return this.apiCall<SoporteTiListResponse>(qs ? `${BASE}?${qs}` : BASE)
  }

  static async show(id: number): Promise<SoporteTiSingleResponse> {
    return this.apiCall<SoporteTiSingleResponse>(`${BASE}/${id}`)
  }

  static async store(body: Record<string, unknown> | FormData): Promise<SoporteTiMutationResponse> {
    return this.apiCall<SoporteTiMutationResponse>(BASE, {
      method: 'POST',
      body: body as Record<string, unknown>
    })
  }

  static async update(id: number, body: Partial<SoporteTiSolicitudApi>): Promise<SoporteTiMutationResponse> {
    return this.apiCall<SoporteTiMutationResponse>(`${BASE}/${id}`, {
      method: 'PUT',
      body
    })
  }

  static async updatePrioridad(
    id: number,
    prioridad: number
  ): Promise<SoporteTiMutationResponse> {
    return this.apiCall<SoporteTiMutationResponse>(`${BASE}/${id}/prioridad`, {
      method: 'PATCH',
      body: { prioridad }
    })
  }

  static async updateComplejidad(
    id: number,
    criticidad: string
  ): Promise<SoporteTiMutationResponse> {
    return this.apiCall<SoporteTiMutationResponse>(`${BASE}/${id}/complejidad`, {
      method: 'PATCH',
      body: { criticidad }
    })
  }

  static async updateEstado(
    id: number,
    payload: SoporteTiActualizarEstadoPayload
  ): Promise<SoporteTiMutationResponse> {
    const body: Record<string, unknown> = {}
    if (payload.estadoCodigo != null) body.estado_codigo = payload.estadoCodigo
    if (payload.estadoId != null) body.estado_id = payload.estadoId
    if (payload.comentario != null) body.comentario = payload.comentario
    return this.apiCall<SoporteTiMutationResponse>(`${BASE}/${id}/estado`, {
      method: 'PATCH',
      body
    })
  }

  static async postMensaje(
    id: number,
    payload: SoporteTiEnviarMensajePayload
  ): Promise<{ success: boolean; data?: SoporteTiMensajeApi; message?: string }> {
    const tieneArchivos = (payload.imagenes?.length ?? 0) > 0
    if (tieneArchivos) {
      const fd = new FormData()
      fd.append('texto', payload.texto)
      if (payload.replyToId != null) fd.append('reply_to_id', String(payload.replyToId))
      payload.imagenes!.forEach((file, i) => fd.append(`imagenes[${i}]`, file))
      return this.apiCall(`${BASE}/${id}/mensajes`, { method: 'POST', body: fd })
    }
    return this.apiCall(`${BASE}/${id}/mensajes`, {
      method: 'POST',
      body: {
        texto: payload.texto,
        reply_to_id: payload.replyToId ?? null
      }
    })
  }

  static async marcarLeidos(
    chatUuid: string,
    mensajeIds: number[]
  ): Promise<{ success: boolean; queued?: number; mensaje_ids?: number[]; message?: string }> {
    return this.apiCall(`/api/soporte-ti/chats/${chatUuid}/mensajes/leidos`, {
      method: 'POST',
      body: { mensaje_ids: mensajeIds }
    })
  }

  static async infoMensaje(
    chatUuid: string,
    mensajeId: number
  ): Promise<{
    success: boolean
    data?: import('~/types/soporteTi').SoporteTiMensajeInfoLecturaApi
    message?: string
  }> {
    return this.apiCall(`/api/soporte-ti/chats/${chatUuid}/mensajes/${mensajeId}/info`)
  }

  static async getMensajes(
    chatUuid: string,
    query: SoporteTiMensajesQuery = {}
  ): Promise<SoporteTiMensajesPaginatedResponse> {
    const q = new URLSearchParams()
    q.set('limit', String(query.limit ?? SOPORTE_TI_CHAT_PAGE_SIZE))
    if (query.before_id != null) q.set('before_id', String(query.before_id))
    return this.apiCall(`/api/soporte-ti/chats/${chatUuid}/mensajes?${q.toString()}`)
  }

  static async postMaqueta(id: number, formData: FormData): Promise<SoporteTiMutationResponse> {
    return this.apiCall<SoporteTiMutationResponse>(`${BASE}/${id}/maqueta`, {
      method: 'POST',
      body: formData
    })
  }

  static async getSlaHoras(
    tipo: 'B' | 'A' = 'B',
    ambito?: 'pm_fases' | 'analista_config'
  ): Promise<{
    success: boolean
    data?: SoporteTiSlaHorasApi[]
    message?: string
  }> {
    const q = new URLSearchParams()
    q.set('tipo', tipo)
    if (tipo === 'A' && ambito) q.set('ambito', ambito)
    return this.apiCall(`/api/soporte-ti/sla-horas?${q.toString()}`)
  }

  static async updateSlaHoras(
    tipo: 'B' | 'A',
    horas: Array<{ id: number; horas: number }>,
    ambito?: 'pm_fases' | 'analista_config'
  ): Promise<{
    success: boolean
    data?: SoporteTiSlaHorasApi[]
    message?: string
  }> {
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

  static async listEstados(): Promise<{ success: boolean; data: SoporteTiEstadoApi[] }> {
    return this.apiCall('/api/soporte-ti/estados')
  }

  static async cambiarEstado(
    id: number,
    payload: SoporteTiCambiarEstadoPayload
  ): Promise<SoporteTiMutationResponse & { historial?: SoporteTiEstadoHistorialApi }> {
    return this.apiCall(`${BASE}/${id}/estado`, {
      method: 'POST',
      body: {
        estado_id: payload.estadoId,
        comentario: payload.comentario ?? null
      }
    })
  }

  static async historialEstados(
    id: number
  ): Promise<{ success: boolean; data: SoporteTiEstadoHistorialApi[] }> {
    return this.apiCall(`${BASE}/${id}/estados/historial`)
  }
}
