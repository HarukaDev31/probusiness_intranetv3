/** Tamaño legible estilo WhatsApp (ej. 25 kB). */
export function tamanoAdjuntoLegible(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${Math.round(bytes / 1024)} kB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export function extensionAdjunto(nombre: string): string {
  const base = nombre.split('?')[0] || nombre
  const ext = base.split('.').pop()
  return (ext || 'archivo').toUpperCase()
}

/** Extensiones que se muestran como imagen inline en la burbuja (no webp). */
const EXT_IMAGEN_INLINE = new Set(['jpg', 'jpeg', 'png', 'gif'])

export function esImagenInlineAdjunto(nombre: string): boolean {
  const ext = extensionAdjunto(nombre).toLowerCase()
  return EXT_IMAGEN_INLINE.has(ext)
}

export function esImagenAdjunto(file: File): boolean {
  return file.type.startsWith('image/')
}

/** Convierte tamaño API ("4 kB", "1024") a bytes aproximados para la UI. */
export function tamanoAdjuntoDesdeApi(tamano: string | null | undefined): number {
  if (!tamano) return 0
  const t = tamano.trim().toLowerCase()
  const n = parseFloat(t)
  if (Number.isNaN(n)) return 0
  if (t.includes('mb')) return Math.round(n * 1048576)
  if (t.includes('kb') || t.includes('k ')) return Math.round(n * 1024)
  if (t.includes('b')) return Math.round(n)
  return Math.round(n)
}
