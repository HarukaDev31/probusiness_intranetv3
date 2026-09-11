export type WaInboxWindowState = 'open' | 'warn' | 'closed'

export interface WaInboxSession {
  id: number | null
  phone_number_id: string
  display_number: string
  label: string
  is_active: boolean
  last_webhook_at?: string | null
  organizacion_id?: number
  organizacion_nombre?: string
  configured?: boolean
  enabled?: boolean
  can_configure?: boolean
}

export interface WaInboxOrgConfig {
  organizacion_id: number
  organizacion_nombre: string
  enabled: boolean
  phone_number_id: string
  waba_id: string
  display_number: string
  graph_api_version: string
  default_language: string
  legacy_fallback: boolean
  preview_from_template: boolean
  session_when_window_open: boolean
  access_token_set: boolean
  app_secret_set: boolean
  webhook_verify_token_set: boolean
}

export interface WaInboxOrgConfigPayload {
  enabled: boolean
  phone_number_id: string
  waba_id: string
  display_number: string
  graph_api_version: string
  default_language: string
  webhook_verify_token: string
  access_token?: string
  app_secret?: string
  legacy_fallback: boolean
  preview_from_template: boolean
  session_when_window_open: boolean
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
  last_direction?: 'in' | 'out' | null
  last_message_type?: string | null
  last_message_delivery_status?: string | null
  last_message_id?: number | null
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
  failed_reason?: string | null
  is_template?: boolean
  template_name?: string | null
  template_params?: Record<string, string> | null
  message_type?: string
  meta_message_id?: string | null
  media_url?: string | null
  media_mime?: string | null
  media_filename?: string | null
  media_size_bytes?: number | null
  reply_to_meta_message_id?: string | null
  reaction_inbound_emoji?: string | null
}

export interface WaInboxComposerReplyTarget {
  metaMessageId: string
  label: string
  text: string
  imageUrl?: string | null
}

export interface WaInboxComposerSendPayload {
  text: string
  file?: File
  /** Varias imágenes/videos en un solo envío (se mandan en secuencia). */
  files?: File[]
  mediaKind?: 'image' | 'video' | 'document' | 'audio'
  replyToMetaMessageId?: string | null
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
  /** DOCUMENT | IMAGE | VIDEO cuando la plantilla Meta lleva media en encabezado */
  header_format?: string | null
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
