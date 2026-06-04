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
