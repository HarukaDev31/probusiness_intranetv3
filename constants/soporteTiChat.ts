/** Emojis frecuentes para el compositor del chat (estilo WhatsApp). */
export const SOPORTE_TI_CHAT_EMOJIS = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊',
  '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘',
  '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝',
  '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐',
  '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌',
  '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢',
  '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠',
  '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️',
  '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨',
  '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
  '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬',
  '👍', '👎', '👏', '🙌', '🤝', '🙏', '💪', '✨',
  '🔥', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤',
  '💯', '✅', '❌', '⭐', '🎉', '🎊', '💬', '📎'
] as const

/** Tipos de archivo admitidos en mensajes de chat (mismo endpoint que imágenes). */
export const SOPORTE_TI_CHAT_ACCEPT_DOCUMENTOS =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z,.webp,.png,.jpg,.jpeg,.gif'

/** Audio / notas de voz. */
export const SOPORTE_TI_CHAT_ACCEPT_AUDIO =
  'audio/*,.mp3,.m4a,.aac,.ogg,.opus,.wav,.webm,.3gp'
