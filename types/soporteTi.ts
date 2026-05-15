export type SoporteTiTipo = 'A' | 'B'
export type SoporteTiSubtipoB = 'B1' | 'B2'

/** Catálogo `soporte_ti_estados` */
export interface SoporteTiEstado {
  id: number
  codigo: string
  nombre: string
  tipoSolicitud: SoporteTiTipo | null
  ordenKanban: number | null
}

/** Fila historial `soporte_ti_solicitud_estados` */
export interface SoporteTiEstadoHistorial {
  id: number
  solicitudId: number
  estadoId: number
  estadoAnteriorId: number | null
  usuarioId: number | null
  usuarioNombre: string | null
  comentario: string | null
  creadoEn: string
  estado?: SoporteTiEstado
  estadoAnterior?: SoporteTiEstado | null
}

export interface SoporteTiMaqueta {
  nombre: string
  tamano: string
  fechaEntrega: string
  aprobada: boolean
  dataUrl?: string | null
}

export interface SoporteTiImagenMensaje {
  url: string
  nombre: string
  tamano?: string | null
}

/** Registro en `soporte_ti_solicitud_evidencias` (texto o imagen por fila) */
export interface SoporteTiEvidenciaItem {
  id?: number
  tipo: 'texto' | 'imagen'
  texto?: string | null
  url?: string | null
  nombre?: string | null
  tamano?: string | null
  mime?: string | null
  orden?: number
}

/** Vista previa del mensaje al que se responde */
export interface SoporteTiMensajeReplyPreview {
  id: number
  remitente: string
  texto: string
  tieneImagen?: boolean
}

export interface SoporteTiMensaje {
  id: number
  remitente: string
  iniciales: string
  color: string
  texto: string
  esSistema: boolean
  marcaTiempo: string
  esPropio?: boolean
  archivoNombre?: string | null
  replyToId?: number | null
  replyTo?: SoporteTiMensajeReplyPreview | null
  imagenes?: SoporteTiImagenMensaje[]
}

/** Mensajes indexados por UUID de sala de chat */
export type SoporteTiChatsPorUuid = Record<string, SoporteTiMensaje[]>

export interface SoporteTiSolicitud {
  backendId?: number | null
  /** UUID de la sala; canal WS y membresía en back */
  chatUuid: string
  codigo: string
  tipo: SoporteTiTipo
  subtipoB: SoporteTiSubtipoB | null
  titulo: string
  area: string
  solicitante: string
  /** Usuario creador (cuando el API lo envía); demo opcional */
  solicitanteUserId?: number | null
  pm: string | null
  analista: string | null
  /**
   * Complejidad de la solicitud (Baja, Media, Alta, Máxima). En API el campo se llama `criticidad`.
   */
  criticidad: string
  /** FK `soporte_ti_estados` — estado actual */
  estadoId: number
  estadoCodigo: string
  /** Nombre legible (denormalizado desde catálogo) */
  estado: string
  faseIndex: number
  progreso: number
  slaHoras: number
  horasTranscurridas: number
  fechaRegistro: string
  ultimaActualizacion: string
  fechaFinEstimado: string | null
  seccionRuta?: string
  descripcion?: string
  maqueta: SoporteTiMaqueta | null
  /** Evidencias persistentes (tabla solicitud_evidencias), no inferidas del chat */
  evidencias?: SoporteTiEvidenciaItem[]
}

export interface SoporteTiCreatePayload {
  tipo: SoporteTiTipo
  subtipoB: SoporteTiSubtipoB | null
  titulo: string
  area: string
  seccionRuta: string
  descripcion: string
  /** Pantallazos opcionales; se envían como primer mensaje con adjuntos tras crear el ticket */
  imagenes?: File[]
}

export interface SoporteTiEnviarMensajePayload {
  texto: string
  replyToId?: number | null
  imagenes?: File[]
}

export interface SoporteTiListFilters {
  q?: string
  tipo?: 'todos' | SoporteTiTipo
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
}

export interface SoporteTiSolicitudApi {
  id: number
  chat_uuid: string
  codigo: string
  tipo_solicitud: SoporteTiTipo
  subtipo_b: SoporteTiSubtipoB | null
  titulo: string
  area: string
  solicitante: string
  solicitante_user_id?: number | null
  pm: string | null
  analista: string | null
  criticidad: string
  estado_id: number
  estado?: SoporteTiEstadoApi | null
  /** Denormalizado opcional (Laravel `mapSolicitud`) */
  estado_codigo?: string | null
  /** Compatibilidad si el API aún envía string */
  estado_legacy?: string | null
  fase_index: number
  progreso: number
  sla_horas: number
  horas_transcurridas: number
  fecha_registro: string
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

export type SoporteTiMaquetaApi = NonNullable<SoporteTiSolicitudApi['maqueta']>

export interface SoporteTiEstadoApi {
  id: number
  codigo: string
  nombre: string
  tipo_solicitud: SoporteTiTipo | null
  orden_kanban: number | null
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

export interface SoporteTiMensajeApi {
  id: number
  remitente: string
  iniciales: string
  color: string
  texto: string
  es_sistema: boolean
  marca_tiempo: string
  es_propio?: boolean
  archivo_nombre?: string | null
  reply_to_id?: number | null
  reply_to?: SoporteTiMensajeReplyPreviewApi | null
  imagenes?: SoporteTiImagenMensajeApi[]
}

export interface SoporteTiChatPaginacionApi {
  has_more: boolean
  oldest_id: number | null
  newest_id: number | null
  per_page: number
  total?: number | null
}

export interface SoporteTiMensajesPaginatedResponse {
  success: boolean
  data: SoporteTiMensajeApi[]
  pagination: SoporteTiChatPaginacionApi
  message?: string
}

export interface SoporteTiChatPaginacion {
  hasMoreOlder: boolean
  oldestId: number | null
  loading: boolean
  loadingOlder: boolean
  initialized: boolean
}

export interface SoporteTiMensajesQuery {
  limit?: number
  before_id?: number | null
}

/** Agregados del listado; opcional si el backend los envía en la misma respuesta */
export interface SoporteTiListStatsApi {
  total: number
  pendientes: number
  en_progreso?: number
  operativas: number
}

/**
 * `data` como objeto: listado bajo una clave + métricas bajo `resumen` / `stats` / `totales`
 * (mismo estilo que otros índices del proyecto: payload + resumen hermano o anidado).
 */
export interface SoporteTiListDataBundleApi {
  solicitudes?: SoporteTiSolicitudApi[]
  items?: SoporteTiSolicitudApi[]
  data?: SoporteTiSolicitudApi[]
  resumen?: SoporteTiListStatsApi
  stats?: SoporteTiListStatsApi
  totales?: SoporteTiListStatsApi
}

export type SoporteTiListResponseData = SoporteTiSolicitudApi[] | SoporteTiListDataBundleApi

export interface SoporteTiListResponse {
  success: boolean
  data: SoporteTiListResponseData
  /** @deprecated Preferir `resumen` o `totales` alineado al resto de APIs */
  stats?: SoporteTiListStatsApi
  /** Métricas para las cards del header (clave recomendada) */
  resumen?: SoporteTiListStatsApi
  totales?: SoporteTiListStatsApi
  message?: string
}

export interface SoporteTiSingleResponse {
  success: boolean
  data: SoporteTiSolicitudApi
  message?: string
}

export interface SoporteTiMutationResponse {
  success: boolean
  data?: SoporteTiSolicitudApi
  message?: string
}

/** Payload broadcast en sala privada por chat_uuid */
export interface SoporteTiWsMensajePayload {
  chat_uuid: string
  codigo: string
  mensaje: SoporteTiMensajeApi
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

export interface SoporteTiCambiarEstadoPayload {
  estadoId: number
  comentario?: string | null
}
