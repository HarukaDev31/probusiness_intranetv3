/**
 * Contratos wire (snake_case) del API Soporte TI.
 * Solo para el adaptador del service — no usar en páginas/composables.
 */
import type { SoporteTiSubtipoB, SoporteTiTipo } from '~/types/soporteTi'

export interface SoporteTiGestionApi {
  es_creador: boolean
  es_staff: boolean
  puede_complejidad: boolean
  puede_complejidad_pm?: boolean
  puede_complejidad_analista?: boolean
  puede_asignacion?: boolean
  puede_estado: boolean
  puede_eliminar?: boolean
  estados: { id: number; codigo: string; nombre: string }[]
  estado_valor: string | null
  complejidad_valor: string | null
  complejidad_pm_valor?: string | null
  complejidad_analista_valor?: string | null
  tiempo_estimado_rango?: boolean
  estado_editable: boolean
  puede_confirmar: boolean
  estado_placeholder: string
  termino_estimado: string
  sla_etiqueta: string | null
  ver_sla: boolean
  puede_en_progreso: boolean
  contador_activo: boolean
  contador_pausado?: boolean
  contador_fin: string | null
  contador_restante_segundos?: number | null
  contador_vencido: boolean
}

export interface SoporteTiEstadoApi {
  id: number
  codigo: string
  nombre: string
  tipo_solicitud: SoporteTiTipo | null
  orden_kanban: number | null
}

export interface SoporteTiEvidenciaApi {
  id: number
  tipo: 'texto' | 'imagen'
  texto?: string | null
  url?: string | null
  nombre?: string | null
  tamano?: string | null
  mime?: string | null
  orden: number
}

export interface SoporteTiImagenMensajeApi {
  url: string
  nombre: string
  tamano?: string | null
}

export interface SoporteTiMensajeReplyPreviewApi {
  id: number
  remitente: string
  texto: string
  tiene_imagen?: boolean
  imagen_url?: string | null
}

export interface SoporteTiSolicitudApi {
  id: number
  chat_uuid: string
  codigo: string
  tipo_solicitud: SoporteTiTipo
  subtipo_b: SoporteTiSubtipoB | null
  titulo: string
  prioridad?: number
  area: string
  solicitante: string
  solicitante_user_id?: number | null
  solicitante_rol?: string | null
  pm: string | null
  pm_user_id?: number | null
  analista: string | null
  analista_user_id?: number | null
  criticidad: string
  complejidad_pm?: string
  complejidad_analista?: string
  estado_id: number
  estado?: SoporteTiEstadoApi | null
  estado_codigo?: string | null
  fase_index: number
  progreso: number
  sla_horas: number
  horas_transcurridas: number
  fecha_registro: string
  fecha_registro_iso?: string
  ultima_actualizacion: string
  fecha_fin_estimado: string | null
  seccion_ruta?: string | null
  descripcion?: string | null
  maqueta?: {
    nombre: string
    tamano: string
    fecha_entrega: string
    aprobada: boolean
    url_preview?: string | null
  } | null
  evidencias?: SoporteTiEvidenciaApi[]
  gestion: SoporteTiGestionApi
}

export interface SoporteTiMensajeApi {
  id: number
  usuario_id?: number | null
  remitente: string
  iniciales: string
  color: string
  avatar_url?: string | null
  texto: string
  es_sistema: boolean
  es_maqueta?: boolean
  marca_tiempo: string
  created_at_iso?: string
  es_propio?: boolean
  archivo_nombre?: string | null
  reply_to_id?: number | null
  reply_to?: SoporteTiMensajeReplyPreviewApi | null
  imagenes?: SoporteTiImagenMensajeApi[]
  adjunto_pendiente?: boolean
  leido?: boolean
  lecturas_count?: number
  destinatarios_count?: number
}

export interface SoporteTiChatPaginacionApi {
  has_more: boolean
  oldest_id: number | null
  newest_id: number | null
  per_page: number
  total?: number | null
}

export interface SoporteTiListStatsApi {
  total: number
  pendientes: number
  en_progreso?: number
  operativas: number
}

export interface SoporteTiCreadorFiltroApi {
  id: number
  nombre: string
}

export interface SoporteTiCreadoresResponseRaw {
  success: boolean
  data: SoporteTiCreadorFiltroApi[]
  message?: string
}

export interface SoporteTiListResponseRaw {
  success: boolean
  data: SoporteTiSolicitudApi[]
  resumen?: SoporteTiListStatsApi
  message?: string
}

export interface SoporteTiSingleResponseRaw {
  success: boolean
  data: SoporteTiSolicitudApi
  message?: string
}

export interface SoporteTiMensajesResponseRaw {
  success: boolean
  data: SoporteTiMensajeApi[]
  pagination: SoporteTiChatPaginacionApi
  message?: string
}

export interface SoporteTiLecturaUsuarioApi {
  usuario_id: number
  nombre: string
  iniciales: string
  avatar_url?: string | null
  telefono?: string | null
  email?: string | null
  leido_en?: string | null
  leido_en_fmt?: string | null
}

export interface SoporteTiMensajeInfoLecturaApi {
  mensaje: SoporteTiMensajeApi
  entregado_en_fmt: string
  leido_por: SoporteTiLecturaUsuarioApi[]
  leido_por_todos: boolean
  destinatarios_count: number
  lecturas_count: number
}

export interface SoporteTiEstadoHistorialApi {
  id: number
  solicitud_id: number
  estado_id: number
  estado_anterior_id: number | null
  usuario_id: number | null
  usuario_nombre: string | null
  comentario: string | null
  created_at: string
  estado?: SoporteTiEstadoApi | null
  estado_anterior?: SoporteTiEstadoApi | null
}

export interface SoporteTiSlaHorasApi {
  id: number
  tipo_solicitud: 'A' | 'B'
  criticidad: string
  horas: number
  ambito?: string | null
  updated_at?: string | null
}

export interface SoporteTiFaseHorasACeldaApi {
  id: number
  fase_codigo: string
  fase_nombre: string
  criticidad: string
  horas: number
  updated_at?: string | null
}

export interface SoporteTiFaseHorasAMatrizApi {
  fases: { codigo: string; nombre: string }[]
  complejidades: string[]
  celdas: SoporteTiFaseHorasACeldaApi[]
}

/** Payloads WS (wire). Adaptar con SoporteTiService.adaptWs* */
export interface SoporteTiWsMensajePayload {
  chat_uuid: string
  codigo: string
  mensaje: SoporteTiMensajeApi
}

export interface SoporteTiWsMensajesLeidosPayload {
  chat_uuid: string
  codigo: string
  lector_usuario_id: number
  mensaje_ids: number[]
}

export interface SoporteTiWsEstadoPayload {
  chat_uuid: string
  codigo: string
  estado_id: number
  estado_codigo: string
  estado: string
  historial?: SoporteTiEstadoHistorialApi | null
  fase_index?: number
  progreso?: number
  ultima_actualizacion?: string
  titulo?: string
}

export interface SoporteTiWsSolicitudCreadaPayload {
  solicitud: SoporteTiSolicitudApi
}
