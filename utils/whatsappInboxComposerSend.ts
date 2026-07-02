import type { WaInboxComposerSendPayload } from '~/types/whatsapp-inbox'
import { guessWaInboxMediaKind } from '~/utils/whatsappInboxMedia'

export function resolveWaInboxComposerFiles(payload: WaInboxComposerSendPayload): File[] {
  if (payload.files?.length) return payload.files
  if (payload.file) return [payload.file]
  return []
}

/** Envía texto solo o varios archivos en secuencia (caption en el primero). */
export async function dispatchWaInboxComposerSends(
  payload: WaInboxComposerSendPayload,
  sendOne: (item: WaInboxComposerSendPayload) => Promise<void>
): Promise<void> {
  const files = resolveWaInboxComposerFiles(payload)
  const caption = payload.text.trim()

  if (!files.length) {
    if (!caption) return
    await sendOne(payload)
    return
  }

  for (let i = 0; i < files.length; i++) {
    await sendOne({
      text: i === 0 ? caption : '',
      file: files[i],
      mediaKind: guessWaInboxMediaKind(files[i]),
      replyToMetaMessageId: i === 0 ? payload.replyToMetaMessageId ?? null : null
    })
  }
}
