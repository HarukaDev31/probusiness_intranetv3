export type TramiteEstado = 'PENDIENTE' | 'SD' | 'PAGADO' | 'EN_TRAMITE' | 'RECHAZADO' | 'COMPLETADO'

export interface TramiteAduana {
  id: number
  id_cotizacion: number | null
  id_consolidado: number
  id_cliente: number | null
  id_entidad: number
  id_tipo_permiso: number
  derecho_entidad: number
  precio: number
  f_inicio: string | null
  f_termino: string | null
  f_caducidad: string | null
  dias: number | null
  estado: TramiteEstado
  created_at?: string
  updated_at?: string
  cotizacion?: { id: number; nombre?: string }
  consolidado?: { id: number; codigo?: string; nombre?: string }
  entidad?: { id: number; nombre: string }
  tipo_permiso?: { id: number; nombre_permiso: string }
  cliente?: { id: number; nombre?: string; ruc?: string; telefono?: string; email?: string }
}

/** Solo los 6 campos del formulario de permiso. El backend puede rellenar el resto por defecto. */
export interface CreateTramiteAduanaRequest {
  id_consolidado: number
  id_cliente?: number | null
  id_cotizacion?: number | null
  id_entidad: number
  id_tipo_permiso: number
  derecho_entidad: number
  precio: number
  estado?: TramiteEstado
}

export interface TramiteAduanaListResponse {
  success: boolean
  data: TramiteAduana[]
  pagination?: { current_page: number; last_page: number; per_page: number; total: number; from: number; to: number }
  error?: string
}

export interface TramiteAduanaResponse {
  success: boolean
  data: TramiteAduana
  error?: string
}

/** Colores por estado (fondo y texto) para chips/badges */
export const TRAMITE_ESTADOS = [
  { value: 'PENDIENTE' as const, label: 'Pendiente', color: 'gray', bgColor: '#AAAAAA', textColor: '#F0F0F0' },
  { value: 'SD' as const, label: 'SD', color: 'yellow', bgColor: '#FFFFCC', textColor: '#333333' },
  { value: 'PAGADO' as const, label: 'Pagado', color: 'green', bgColor: '#33CC33', textColor: '#F0F0F0' },
  { value: 'EN_TRAMITE' as const, label: 'En tramite', color: 'orange', bgColor: '#FF6633', textColor: '#F0F0F0' },
  { value: 'RECHAZADO' as const, label: 'Rechazado', color: 'gray', bgColor: '#AAAAAA', textColor: '#F0F0F0' },
  { value: 'COMPLETADO' as const, label: 'Completado', color: 'sky', bgColor: '#3399FF', textColor: '#F0F0F0' },
]

/** Nombre de la categoría (carpeta). Puede ser cualquiera que envíe el front; el backend lo almacena como string. */
export type DocumentoCategoria = string

/** Categoría (carpeta) del trámite, devuelta por GET tramites/{id}/categorias */
export interface TramiteCategoria {
  id: number
  id_tramite: number
  nombre: string
}

export interface TramiteCategoriaListResponse {
  success: boolean
  data: TramiteCategoria[]
  error?: string
}

export interface TramiteDocumento {
  id: number
  id_tramite: number
  categoria: DocumentoCategoria
  id_categoria?: number
  nombre_documento: string
  extension: string
  peso: number
  nombre_original: string
  ruta: string
  url: string
  created_at: string | null
}

export interface TramiteDocumentoListResponse {
  success: boolean
  data: TramiteDocumento[]
  tramite?: {
    id: number
    estado: string
    entidad: string | null
    tipo_permiso: string | null
    consolidado: string | null
  }
  error?: string
}

export interface TramiteDocumentoResponse {
  success: boolean
  data: TramiteDocumento
  error?: string
}

/** Nombres de categoría por defecto (carpetas iniciales). El usuario puede crear más escribiendo el nombre. */
export const DOCUMENTO_CATEGORIAS_DEFAULT = [
  'Documentos para tramite',
  'CPB de tramite',
  'Documento resolutivo',
]

/** Opciones legacy (value = label) por si algún componente sigue usando select de categoría. */
export const DOCUMENTO_CATEGORIAS = DOCUMENTO_CATEGORIAS_DEFAULT.map(nombre => ({
  value: nombre,
  label: nombre,
}))
