export type WaInboxMediaKind = 'image' | 'video' | 'document' | 'audio'

export function guessWaInboxMediaKind(file: File): WaInboxMediaKind {
  const mime = (file.type || '').toLowerCase()
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  return 'document'
}
