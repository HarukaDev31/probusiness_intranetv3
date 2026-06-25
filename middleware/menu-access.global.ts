import type { AuthMenu } from '~/services/authService'
import { collectMenuRoutes, getMenuItemRoute, normalizeMenuPath } from '~/utils/menuRoutes'

const getMenuRoute = (item: AuthMenu): string | null => getMenuItemRoute(item)

const collectAllowedRoutes = (items: AuthMenu[] = []): string[] => collectMenuRoutes(items)

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

const canAccessEntregaFirmaCarga = (
  currentPath: string,
  allowedRoutes: string[],
): boolean => {
  const match = currentPath.match(/^(.+\/entrega)\/firma-carga\/\d+$/)
  if (!match) return false
  const entregaBase = match[1]
  return allowedRoutes.some(
    (r) => r === entregaBase || r.startsWith(`${entregaBase}/`) || entregaBase.startsWith(`${r}/`) || r.startsWith(`${entregaBase}/`),
  )
}

export default defineNuxtRouteMiddleware((to) => {
  if (process.server) return
  if (to.path === '/login') return
  if (to.path === '/') return
  if (to.path === '/notificaciones') return
  if (to.path === '/preferencias-notificaciones') return
  if (to.path === '/perfil') return
  if (to.path === '/copiloto') return

  if (to.path === '/coordinacion/whatsapp-inbox' || to.path.startsWith('/coordinacion/whatsapp-inbox/')) {
    return
  }
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
  const currentPath = normalizeMenuPath(to.path)

  if (canAccessRoute(currentPath, allowedRoutes)) return
  if (canAccessNumericDetailUnderAllowedParent(currentPath, allowedRoutes)) return
  if (canAccessEntregaFirmaCarga(currentPath, allowedRoutes)) return

  const fallbackRoute = allowedRoutes.find((route) => route && route !== '#')
  if (fallbackRoute && fallbackRoute !== currentPath) {
    return navigateTo(fallbackRoute)
  }

  return navigateTo('/login')
})
