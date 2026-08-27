import type { SoporteTiComplejidad } from '~/utils/soporteTiComplejidad'

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

export interface SoporteTiMensajeReplyPreview {
  id: number
  remitente: string
  texto: string
  tieneImagen?: boolean
  imagenUrl?: string | null
}

export type SoporteTiEstadoEnvio = 'pendiente' | 'enviando' | 'entregado' | 'leido' | 'error'

export interface SoporteTiMensaje {
  id: number
  clientId?: string
  remitente: string
  iniciales: string
  color: string
  avatarUrl?: string | null
  texto: string
  esSistema: boolean
  marcaTiempo: string
  esPropio?: boolean
  archivoNombre?: string | null
  replyToId?: number | null
  replyTo?: SoporteTiMensajeReplyPreview | null
  imagenes?: SoporteTiImagenMensaje[]
  estadoEnvio?: SoporteTiEstadoEnvio
  adjuntoPendiente?: boolean
}

export type SoporteTiChatsPorUuid = Record<string, SoporteTiMensaje[]>

export interface SoporteTiSolicitud {
  backendId?: number | null
  chatUuid: string
  codigo: string
  tipo: SoporteTiTipo
  subtipoB: SoporteTiSubtipoB | null
  titulo: string
  prioridad: number
  area: string
  solicitante: string
  solicitanteUserId?: number | null
  pm: string | null
  pmUserId?: number | null
  analista: string | null
  analistaUserId?: number | null
  criticidad: string
  complejidadPm?: string
  complejidadAnalista?: string
  estadoId: number
  estadoCodigo: string
  estado: string
  faseIndex: number
  progreso: number
  slaHoras: number
  horasTranscurridas: number
  fechaRegistro: string
  fechaRegistroIso?: string
  ultimaActualizacion: string
  fechaFinEstimado: string | null
  seccionRuta?: string
  descripcion?: string
  maqueta: SoporteTiMaqueta | null
  evidencias?: SoporteTiEvidenciaItem[]
  gestion: SoporteTiGestion
}

export interface SoporteTiGestionEstado {
  id: number
  codigo: string
  nombre: string
}

export interface SoporteTiGestion {
  esCreador: boolean
  esStaff: boolean
  puedeComplejidad: boolean
  puedeComplejidadPm: boolean
  puedeComplejidadAnalista: boolean
  puedeAsignacion: boolean
  puedeEstado: boolean
  puedeEliminar: boolean
  estados: SoporteTiGestionEstado[]
  estadoValor: string | null
  complejidadValor: SoporteTiComplejidad | null
  complejidadPmValor: SoporteTiComplejidad | null
  complejidadAnalistaValor: SoporteTiComplejidad | null
  tiempoEstimadoRango: boolean
  estadoEditable: boolean
  puedeConfirmar: boolean
  estadoPlaceholder: string
  terminoEstimado: string
  slaEtiqueta: string | null
  verSla: boolean
  puedeEnProgreso: boolean
  contadorActivo: boolean
  contadorPausado: boolean
  contadorFin: string | null
  contadorRestanteSegundos: number | null
  contadorVencido: boolean
}

export interface SoporteTiCreatePayload {
  tipo: SoporteTiTipo
  subtipoB: SoporteTiSubtipoB | null
  titulo: string
  area: string
  seccionRuta: string
  descripcion: string
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
  estadoCodigo?: string | 'todos'
  prioridad?: number | null
  soloMias?: boolean
}

export interface SoporteTiListStats {
  total: number
  pendientes: number
  enProgreso: number
  operativas: number
}

export interface SoporteTiChatPaginacion {
  hasMoreOlder: boolean
  oldestId: number | null
  loading: boolean
  loadingOlder: boolean
  initialized: boolean
}

export interface SoporteTiLecturaUsuario {
  usuarioId: number
  nombre: string
  iniciales: string
  avatarUrl?: string | null
  telefono?: string | null
  email?: string | null
  leidoEn?: string | null
  leidoEnFmt?: string | null
}

export interface SoporteTiMensajeInfoLectura {
  mensaje: SoporteTiMensaje
  entregadoEnFmt: string
  leidoPor: SoporteTiLecturaUsuario[]
  leidoPorTodos: boolean
  destinatariosCount: number
  lecturasCount: number
}

export interface SoporteTiCambiarEstadoPayload {
  estadoId: number
  comentario?: string | null
}

export interface SoporteTiActualizarEstadoPayload {
  estadoId?: number
  estadoCodigo?: string
  comentario?: string | null
}

/** Wire WS — preferir SoporteTiService.adaptWs* en handlers. */
export type {
  SoporteTiWsMensajePayload,
  SoporteTiWsMensajesLeidosPayload,
  SoporteTiWsEstadoPayload
} from '~/services/soporteTi/apiTypes'
