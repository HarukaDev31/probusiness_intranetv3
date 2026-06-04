import type { WaCopilotoConversation, WaCopilotoMessage } from '~/types/wa-copiloto'

export interface WaCopilotoWsMessageCreatedPayload {
  conversation_id: number
  message: WaCopilotoMessage
  conversation: WaCopilotoConversation
}

export interface WaCopilotoWsMessageStatusPayload {
  conversation_id: number
  message_id: number
  delivery_status: string
  message?: WaCopilotoMessage | null
}

export interface WaCopilotoWsMessageInsightsPayload {
  conversation_id: number
  message_id: number
  phone_e164?: string
  temperatura_mensaje?: number | null
  temperatura_lead?: number | null
  insights: import('~/types/wa-copiloto').WaCopilotoMessageInsight[]
  ficha?: import('~/types/wa-copiloto').WaCopilotoFichaSnapshot
}
