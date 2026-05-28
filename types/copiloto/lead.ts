export type CopilotoMessageDirection = 'in' | 'out' | 'sys'

export interface CopilotoChatMessage {
  dir: CopilotoMessageDirection
  txt: string
  t: string
  temp?: number
  sigs?: string[]
  why?: string
}

export interface CopilotoImportHistoryRow {
  f: string
  r: string
  c: string
  p: string
}

export interface CopilotoLead {
  id: string
  phone?: string
  av: string
  name: string
  sub: string
  score: number
  prob: string
  temp: number
  tLbl: string
  action: string
  why: string
  prev: string
  dot: string
  cbm: string
  inv: string
  hist: CopilotoImportHistoryRow[]
  msgs: CopilotoChatMessage[]
  advisorId?: string
  advisorName?: string
}

export type CopilotoPipelineStageId = 'contacto' | 'cotizacion' | 'negociacion' | 'cierre'

export interface CopilotoTeamMember {
  id: string
  initials: string
  name: string
  dealsMes: number
  metaDeals: number
  pipeline: string
  conversion: string
  alertas: number
  leadsActivos: number
}

export interface CopilotoKpiMetric {
  id: string
  label: string
  shortLabel: string
  value: string
  sub: string
  icon: string
  accent?: string
}
