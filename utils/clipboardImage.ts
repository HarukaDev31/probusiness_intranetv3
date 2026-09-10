const ACCEPTED_CLIPBOARD_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
])

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export function esTargetEdicionTexto(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}

function normalizarImagenPegada(file: File, mime: string): File {
  const type = (file.type || mime || 'image/png').toLowerCase()
  const ext = EXT_BY_MIME[type] || 'png'
  const name = file.name?.trim()
  if (name && name.includes('.')) return file
  return new File([file], `pegado-${Date.now()}.${ext}`, { type: file.type || mime || 'image/png' })
}

/** Primera imagen pegable del portapapeles (png, jpeg, webp, gif). */
export function imagenDesdePortapapeles(e: ClipboardEvent): File | null {
  const dt = e.clipboardData
  if (!dt) return null

  for (const item of Array.from(dt.items)) {
    if (item.kind !== 'file') continue
    const type = (item.type || '').toLowerCase()
    if (!ACCEPTED_CLIPBOARD_IMAGE_TYPES.has(type)) continue
    const raw = item.getAsFile()
    if (!raw) continue
    return normalizarImagenPegada(raw, type)
  }

  for (const file of Array.from(dt.files)) {
    const type = (file.type || '').toLowerCase()
    if (!ACCEPTED_CLIPBOARD_IMAGE_TYPES.has(type)) continue
    return normalizarImagenPegada(file, type)
  }

  return null
}
