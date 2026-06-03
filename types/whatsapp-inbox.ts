export type WaInboxWindowState = 'open' | 'warn' | 'closed'

export interface WaInboxSession {
  id: number
  phone_number_id: string
  display_number: string
  label: string
  is_active: boolean
  last_webhook_at?: string | null
}

export interface WaInboxConversation {
  id: number
  contact_name: string
  phone_display: string
  phone_e164: string
  initials: string
  last_message_preview?: string | null
  last_message_at?: string | null
  last_message_time_label?: string
  unread_count: number
  assigned_user_id?: number | null
  assigned_user_name?: string | null
  window_state: WaInboxWindowState
  window_label: string
  window_expires_at?: string | null
  can_send_text: boolean
  channel_label: string
  status: string
}

export interface WaInboxMessage {
  id: number
  direction: 'in' | 'out'
  body?: string | null
  sent_at?: string | null
  time_label?: string
  delivery_status?: string | null
  is_template?: boolean
  template_name?: string | null
  message_type?: string
}

export type WaInboxTemplateParamType = 'text' | 'file'

export interface WaInboxTemplateParamDef {
  name: string
  type: WaInboxTemplateParamType
  label?: string
  /** document | image | video — para plantillas Meta con encabezado media */
  file_kind?: string
}

export interface WaInboxTemplate {
  name: string
  label: string
  language: string
  text: string
  params: string[]
  param_defs?: WaInboxTemplateParamDef[]
}

export interface WaInboxTemplateSendPayload {
  template_name: string
  params: Record<string, string>
  files?: Record<string, File>
}

export interface WaInboxAssignableUser {
  id: number
  name: string
}

export type WaInboxFilter = 'todas' | 'sin-asignar' | 'mis' | 'cerradas'
