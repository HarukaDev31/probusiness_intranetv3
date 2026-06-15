import { archivosDesdePortapapeles } from '~/utils/soporteTiChatAdjunto'
import { guessWaInboxMediaKind } from '~/utils/whatsappInboxMedia'
import type { WaInboxMediaKind } from '~/utils/whatsappInboxMedia'

export function esMediaVisualWaInbox(file: File): boolean {
  const kind = guessWaInboxMediaKind(file)
  return kind === 'image' || kind === 'video'
}

/** Imágenes y videos pegados desde el portapapeles. */
export function mediaVisualDesdePortapapeles(e: ClipboardEvent): File[] {
  return archivosDesdePortapapeles(e).filter((file) => esMediaVisualWaInbox(file))
}

export function nombreArchivoPegado(file: File): string {
  if (file.name && file.name.trim()) return file.name
  const sub = (file.type || 'image/png').split('/')[1] || 'png'
  return `pegado-${Date.now()}.${sub}`
}

export function normalizarArchivoPegado(file: File): File {
  if (file.name && file.name.trim()) return file
  return new File([file], nombreArchivoPegado(file), { type: file.type || 'image/png' })
}

export function mediaKindWaInbox(file: File): WaInboxMediaKind {
  return guessWaInboxMediaKind(file)
}
