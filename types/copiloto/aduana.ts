export type CopilotoAduanaItemTipo =
  | 'producto'
  | 'rubro'
  | 'permiso'
  | 'antidumping'
  | 'etiquetado'
  | 'documento_especial'

export interface CopilotoAduanaItem {
  id: number
  tipo: CopilotoAduanaItemTipo
  titulo: string
  rubro?: string | null
  subpartida?: string | null
  entidad?: string | null
  restriccion?: string | null
  detalle?: string | null
  observaciones?: string | null
}

export interface CopilotoAduanaContext {
  terms: string[]
  items: CopilotoAduanaItem[]
  knowledge_block?: string
}
