import type { WaInboxConversation, WaInboxMessage } from '~/types/whatsapp-inbox'

export interface WaInboxWsMessageCreatedPayload {
  conversation_id: number
  message: WaInboxMessage
  conversation: WaInboxConversation
}

export interface WaInboxWsMessageStatusPayload {
  conversation_id: number
  message_id: number
  delivery_status: string
  message?: WaInboxMessage | null
}

export interface WaInboxWsConversationReadPayload {
  conversation_id: number
  conversation?: WaInboxConversation | null
}
