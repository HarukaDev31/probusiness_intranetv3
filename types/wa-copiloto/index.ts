export type {
  WaInboxConversation,
  WaInboxFilter,
  WaInboxMessage,
  WaInboxSession,
  WaInboxTemplate,
  WaInboxAssignableUser,
  WaInboxComposerSendPayload
} from '~/types/whatsapp-inbox'

import type { WaInboxConversation as BaseConversation } from '~/types/whatsapp-inbox'

/** Conversación Copiloto; puede ser contacto del directorio sin chat en esta línea aún. */
export type WaCopilotoConversation = BaseConversation & {
  pending_contact?: boolean
  contact_id?: number
  source?: string
  origin_line_number?: string | null
  origin_line_label?: string | null
  /** Puntaje IA del lead (0–100), cacheado en conversación. */
  temperatura?: number | null
  ai_temperatura_at?: string | null
  customer_initiated_at?: string | null
  pipeline_stage_id?: number | null
  pipeline_stage_slug?: string | null
  pipeline_stage_label?: string | null
  pipeline_major?: string | null
}

export type WaCopilotoPipelineMajor = 'nuevo' | 'en_progreso' | 'cerrado' | 'postventa'

export type WaCopilotoPipelineStage = {
  id: number
  major: WaCopilotoPipelineMajor
  slug: string
  label: string
  sort_order: number
  is_system: boolean
}

export type WaCopilotoKanbanCard = {
  conversation_id: number
  contact_name: string
  phone_e164: string
  assigned_user_id?: number | null
  assigned_user_name?: string | null
  unread_count: number
  temperatura?: number | null
  last_message_at?: string | null
  last_message_preview?: string
  pipeline_stage_id?: number | null
}

export type WaCopilotoKanbanColumn = {
  stage: WaCopilotoPipelineStage
  cards: WaCopilotoKanbanCard[]
  count: number
}

export type WaCopilotoPipelineKpis = {
  deals_cerrados: number
  deals_meta: number
  pipeline_activo: number
  conversion_pct: number
  alertas: number
  leads_activos: number
}

export type WaCopilotoFilter = import('~/types/whatsapp-inbox').WaInboxFilter
export type WaCopilotoMessage = import('~/types/whatsapp-inbox').WaInboxMessage & {
  insights?: WaCopilotoMessageInsight[]
}
export type WaCopilotoSession = import('~/types/whatsapp-inbox').WaInboxSession
export type WaCopilotoTemplate = import('~/types/whatsapp-inbox').WaInboxTemplate
export type WaCopilotoAssignableUser = import('~/types/whatsapp-inbox').WaInboxAssignableUser
export type WaCopilotoComposerSendPayload = import('~/types/whatsapp-inbox').WaInboxComposerSendPayload

export type WaCopilotoMessageInsightKind = 'temperatura' | 'comentario' | 'sugerencia'

export type WaCopilotoMessageInsight = {
  id: number
  message_id?: number
  kind: WaCopilotoMessageInsightKind
  label?: string | null
  body: string
  score?: number | null
}

export type WaCopilotoFichaSnapshot = {
  temperatura?: number
  nivel?: string
  senales?: string[]
  objecion?: string | null
  sugerencia?: string | null
  sugerencia_corta?: string | null
  accion_sugerida?: string | null
  motivo?: string | null
}

export type WaCopilotoSuggestionOutcome = 'used' | 'modified' | 'ignored'

export type WaCopilotoSuggestionUsage = {
  id: number
  conversation_id: number
  message_id?: number | null
  insight_id?: number | null
  outcome: WaCopilotoSuggestionOutcome
  suggested_text: string
  final_text?: string | null
  created_at?: string
}

export type CopilotoSuggestionOption = {
  id: string
  text: string
  label?: string
  insightId?: number
  messageId?: number
}
