export interface ManualUsuarioRoleSummary {
  slug: string
  id_grupo: number
  nombre: string
}

export interface ManualUsuarioContext {
  title: string
  description: string
  is_root: boolean
  can_download_global_pdf: boolean
  my_role: ManualUsuarioRoleSummary | null
  roles: ManualUsuarioRoleSummary[]
}

export interface ManualUsuarioChapter {
  id: string
  file: string
  title: string
  markdown: string
  html: string
  screenshots?: Array<{
    alt: string
    src: string
    url: string
  }>
}

export type ManualBlockTipo =
  | 'grupo'
  | 'texto'
  | 'callout'
  | 'media'
  | 'flow'
  | 'embed'
  | 'tabla'
  | 'filtros'
  | 'tabs'
  | 'toolbar'
  | 'modal'
  | 'card'
  | 'accion'
  | 'timeline'
  | string

export interface ManualPage {
  id: number
  role_slug?: string
  id_grupo?: number | null
  modulo_key: string
  titulo: string
  descripcion?: string | null
  orden: number
  publicado?: boolean
  blocks: ManualBlock[]
  created_at?: string | null
  updated_at?: string | null
}

export interface ManualBlock {
  id: number
  pagina_id?: number
  parent_id?: number | null
  tipo: ManualBlockTipo
  titulo?: string | null
  /** Ruta/clave del grupo (solo tipo grupo). */
  clave?: string | null
  payload: {
    subtitulo?: string | null
    source?: Record<string, any> | null
    snapshot?: Record<string, any>
    [key: string]: any
  }
  orden: number
  children?: ManualBlock[]
}

export interface ManualUsuarioRolePayload {
  slug: string
  id_grupo: number
  nombre: string
  meta?: Record<string, unknown>
}

export interface ManualUsuarioManualData {
  source?: 'db'
  role: ManualUsuarioRolePayload
  pages: ManualPage[]
  pdf_url: string
}

export interface ManualAdminMeta {
  roles: ManualUsuarioRoleSummary[]
  block_tipos: string[]
  grupo_tipos?: string[]
  widget_tipos?: string[]
  ui_catalog: ManualUiCatalogItem[]
  ui_catalog_categories: Array<{ key: string; label: string }>
  page_widgets: ManualPageWidgetCatalog[]
}

export interface ManualPageWidgetCatalog {
  key: string
  label: string
  page_path: string
  widgets: Array<{
    key: string
    label: string
    tipo: string
    component: string
    api_hint?: string | null
    snapshot: Record<string, any>
  }>
}

export interface ManualUiCatalogItem {
  key: string
  label: string
  category: string
  module: string
  source: string
  description: string
  html: string
  css: string
}

export interface ManualAdminPageSummary {
  id: number
  role_slug: string
  id_grupo?: number | null
  modulo_key: string
  titulo: string
  descripcion?: string | null
  orden: number
  publicado: boolean
  bloques_count: number
  updated_at?: string | null
}

export interface ManualMediaItem {
  id: number
  path: string
  alt?: string | null
  mime?: string | null
  uploaded_by?: number | null
  url: string
  created_at?: string | null
}

export interface ManualUsuarioApiResponse<T> {
  status: string
  message?: string
  data: T
}
