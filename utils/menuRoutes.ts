import type { AuthMenu } from '~/services/authService'

export const normalizeMenuPath = (path: string): string => {
  if (!path) return '/'
  const normalized = `/${path.replace(/\\/g, '/').replace(/^\/+/, '')}`.replace(/\/{2,}/g, '/')
  return normalized === '/' ? normalized : normalized.replace(/\/+$/, '')
}

export const getMenuItemRoute = (item: AuthMenu): string | null => {
  const intranetUrl = (item.url_intranet_v2 ?? '').trim()
  if (intranetUrl && intranetUrl !== '#') {
    return normalizeMenuPath(intranetUrl)
  }
  return null
}

/** Rutas únicas del menú (orden de aparición), listas para prefetch. */
export const collectMenuRoutes = (items: AuthMenu[] = [], limit?: number): string[] => {
  const routes: string[] = []
  const seen = new Set<string>()

  const walk = (menuItems: AuthMenu[]) => {
    for (const item of menuItems) {
      const route = getMenuItemRoute(item)
      if (route && route !== '#' && !seen.has(route)) {
        seen.add(route)
        routes.push(route)
        if (limit != null && routes.length >= limit) return
      }

      if (Array.isArray(item.Hijos) && item.Hijos.length) walk(item.Hijos)
      if (limit != null && routes.length >= limit) return
      if (Array.isArray(item.SubHijos) && item.SubHijos.length) walk(item.SubHijos)
      if (limit != null && routes.length >= limit) return
    }
  }

  walk(items)
  return routes
}
