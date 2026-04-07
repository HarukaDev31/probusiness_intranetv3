import type { AuthMenu } from '~/services/authService'

const normalizePath = (path: string): string => {
  if (!path) return '/'
  const normalized = `/${path.replace(/\\/g, '/').replace(/^\/+/, '')}`.replace(/\/{2,}/g, '/')
  return normalized === '/' ? normalized : normalized.replace(/\/+$/, '')
}

const getMenuRoute = (item: AuthMenu): string | null => {
  const intranetUrl = (item.url_intranet_v2 ?? '').trim()
  if (intranetUrl && intranetUrl !== '#') {
    return normalizePath(intranetUrl)
  }
  return null
}

const collectAllowedRoutes = (items: AuthMenu[] = []): string[] => {
  const routes = new Set<string>()

  const walk = (menuItems: AuthMenu[]) => {
    for (const item of menuItems) {
      const route = getMenuRoute(item)
      if (route) routes.add(route)

      if (Array.isArray(item.Hijos) && item.Hijos.length) walk(item.Hijos)
      if (Array.isArray(item.SubHijos) && item.SubHijos.length) walk(item.SubHijos)
    }
  }

  walk(items)
  return Array.from(routes)
}

const canAccessRoute = (currentPath: string, allowedRoutes: string[]): boolean => {
  if (!allowedRoutes.length) return false

  return allowedRoutes.some((allowedRoute) => {
    if (allowedRoute === '/') return currentPath === '/'
    return currentPath === allowedRoute || currentPath.startsWith(`${allowedRoute}/`)
  })
}

/**
 * Si el menú incluye `ruta/ruta1` (cualquier subruta bajo `ruta`), permite entrar a `ruta/:id`
 * cuando `:id` es numérico, aunque ese detalle no esté en el menú.
 */
const canAccessNumericDetailUnderAllowedParent = (
  currentPath: string,
  allowedRoutes: string[],
): boolean => {
  const segments = currentPath.split('/').filter(Boolean)
  if (segments.length !== 2) return false
  const [parent, leaf] = segments
  if (!parent || !/^\d+$/.test(leaf)) return false

  const parentPath = `/${parent}`
  return allowedRoutes.some(
    (r) => r === parentPath || r.startsWith(`${parentPath}/`),
  )
}

export default defineNuxtRouteMiddleware((to) => {
  if (process.server) return
  if (to.path === '/login') return
  if (to.path === '/') return
  if (to.path === '/notificaciones') return
  if (to.path === '/perfil') return
  const token = localStorage.getItem('auth_token')
  const user = localStorage.getItem('auth_user')
  if (!token || !user) {
    return navigateTo('/login')
  }

  const storedMenu = localStorage.getItem('auth_menu')
  if (!storedMenu) {
    return navigateTo('/login')
  }

  let menu: AuthMenu[] = []
  try {
    menu = JSON.parse(storedMenu)
  } catch {
    return navigateTo('/login')
  }

  const allowedRoutes = collectAllowedRoutes(menu)
  const currentPath = normalizePath(to.path)

  if (canAccessRoute(currentPath, allowedRoutes)) return
  if (canAccessNumericDetailUnderAllowedParent(currentPath, allowedRoutes)) return

  const fallbackRoute = allowedRoutes.find((route) => route && route !== '#')
  if (fallbackRoute && fallbackRoute !== currentPath) {
    return navigateTo(fallbackRoute)
  }

  return navigateTo('/login')
})
