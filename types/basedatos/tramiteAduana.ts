export type TramiteEstado = 'PENDIENTE' | 'SD' | 'PAGADO' | 'EN_TRAMITE' | 'RECHAZADO' | 'COMPLETADO'

export interface TramiteAduanaTipoPermisoItem {
  id: number
  nombre_permiso: string
  derecho_entidad: number
  estado: TramiteEstado
  /** Por tipo_permiso (pivot) */
  f_inicio?: string | null
  f_termino?: string | null
  f_caducidad?: string | null
  dias?: number | null
}

export interface TramiteAduana {
  id: number
  id_cotizacion: number | null
  id_consolidado: number
  id_cliente: number | null
  id_entidad: number
  precio: number
  f_inicio: string | null
  f_termino: string | null
  f_caducidad: string | null
  dias: number | null
  estado: TramiteEstado
  /** Tramitador (decimal 10,2) compartido por permiso (todos los tipo_permiso) */
  tramitador?: number | null
  created_at?: string
  updated_at?: string
  cotizacion?: { id: number; nombre?: string }
  consolidado?: { id: number; codigo?: string; nombre?: string }
  entidad?: { id: number; nombre: string }
  tipos_permiso: TramiteAduanaTipoPermisoItem[]
  cliente?: { id: number; nombre?: string; ruc?: string; telefono?: string; email?: string }
  /** Suma de montos de pagos (vouchers) registrados en pago servicio */
  total_pago_servicio?: number
}

export interface CreateTramiteAduanaRequest {
  id_consolidado: number
  id_cliente?: number | null
  id_cotizacion?: number | null
  id_entidad: number
  /** Array de tipos de permiso (derecho y fechas por tipo) */
  tipos_permiso: {
    id_tipo_permiso: number
    derecho_entidad: number
    f_inicio?: string | null
    f_termino?: string | null
    f_caducidad?: string | null
    dias?: number | null
  }[]
  precio: number
  estado?: TramiteEstado
  /** Tramitador (decimal 10,2) compartido por permiso */
  tramitador?: number | null
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

/** Nombre de la categoría (carpeta). */
export type DocumentoCategoria = string

/** Categoría (carpeta) del trámite, devuelta por API */
export interface TramiteCategoria {
  id: number
  id_tramite: number
  nombre: string
  seccion?: 'documentos_tramite' | 'seguimiento'
  id_tipo_permiso?: number | null
}

export interface TramiteCategoriaListResponse {
  success: boolean
  data: TramiteCategoria[]
  error?: string
}

export type DocumentoSeccion = 'documentos_tramite' | 'fotos' | 'pago_servicio' | 'seguimiento'

export interface TramiteDocumento {
  id: number
  id_tramite: number
  id_tipo_permiso?: number | null
  seccion?: DocumentoSeccion
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

export interface TipoPermisoSection {
  id_tipo_permiso: number
  nombre: string
  estado: TramiteEstado
  /** Fecha de caducidad por tipo (pivot), independiente por tipo_permiso */
  f_caducidad?: string | null
  documentos_tramite: TramiteDocumento[]
  fotos: TramiteDocumento[]
  /** Seguimiento por tipo (Expediente, Decreto, Hoja resumen); RH va en seguimiento_compartido */
  seguimiento?: TramiteDocumento[]
}

export interface PagoConDatos {
  document: TramiteDocumento
  monto: string | null
  fecha_pago: string | null
  banco: string | null
}

export interface TramiteDocumentoListResponse {
  success: boolean
  data: TramiteDocumento[]
  tramite?: {
    id: number
    estado: string
    entidad: string | null
    /** Nombre del cliente (cotización o cliente) */
    cliente: string | null
    tipos_permiso: string[]
    /** Carga a la que pertenece (ej. #154 - 2025) */
    consolidado: string | null
    f_caducidad: string | null
  }
  categorias?: TramiteCategoria[]
  tipos_permiso_sections?: TipoPermisoSection[]
  pago_servicio?: TramiteDocumento[]
  /** Cada pago con su documento (voucher) y datos (monto, banco, fecha) para mostrar uno debajo del otro */
  pagos_con_datos?: PagoConDatos[]
  /** Solo RH o Factura del tramitador (compartido entre todos los permisos) */
  seguimiento_compartido?: TramiteDocumento[]
  seguimiento_por_tipo?: Record<number, TramiteDocumento[]>
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
