const CDN_BASE_URL = 'https://cdn.probusiness.pe'

function collapseSlashes(path: string): string {
  return path.replace(/\/{2,}/g, '/')
}

/**
 * Normaliza URLs de archivos devueltas por la API:
 * - quita barras escapadas (\/)
 * - colapsa dobles slash en la ruta
 * - convierte rutas relativas legacy (assets/...) a CDN
 */
export function normalizePublicFileUrl(url: string | null | undefined): string | null {
  if (url == null || String(url).trim() === '') {
    return null
  }

  let cleaned = String(url)
    .replace(/\\\//g, '/')
    .replace(/\\/g, '/')
    .trim()

  if (!cleaned) {
    return null
  }

  if (/^https?:\/\//i.test(cleaned)) {
    try {
      const parsed = new URL(cleaned)
      parsed.pathname = collapseSlashes(parsed.pathname)
      return parsed.toString()
    } catch {
      return cleaned.replace(/([^:]\/)\/+/g, '$1')
    }
  }

  const path = collapseSlashes(cleaned.replace(/^\/+/, ''))
  if (!path) {
    return null
  }

  if (path.startsWith('assets/')) {
    return `${CDN_BASE_URL}/${path}`
  }

  const resolved = resolveStorageFileUrl(path)
  return resolved || null
}

/** Ruta relativa del storage Laravel → URL absoluta. */
export function resolveStorageFileUrl(url: string): string {
  const cleaned = (url || '').replace(/\\\//g, '/').trim()
  if (!cleaned) return ''
  if (/^https?:\/\//i.test(cleaned)) {
    return normalizePublicFileUrl(cleaned) || cleaned
  }

  const config = useRuntimeConfig()
  const apiBase = String(config.public.apiBaseUrl || '').replace(/\/$/, '')
  const origin = apiBase.replace(/\/api\/?$/i, '')
  const path = collapseSlashes(cleaned.replace(/^\/+/, ''))

  if (path.startsWith('storage/')) {
    return `${origin}/${path}`
  }
  return `${origin}/storage/${path}`
}
