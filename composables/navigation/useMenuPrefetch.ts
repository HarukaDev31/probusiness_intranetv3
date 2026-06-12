import { preloadRouteComponents } from '#app'
import type { AuthMenu } from '~/services/authService'
import { collectMenuRoutes } from '~/utils/menuRoutes'

const DEFAULT_PREFETCH_LIMIT = 10

export const useMenuPrefetch = () => {
  const prefetchRoutes = async (routes: string[]) => {
    if (!process.client || !routes.length) return

    await Promise.allSettled(
      routes.map((route) => preloadRouteComponents(route)),
    )
  }

  const prefetchFromMenu = async (menu: AuthMenu[], limit = DEFAULT_PREFETCH_LIMIT) => {
    const routes = collectMenuRoutes(menu, limit)
    await prefetchRoutes(routes)
  }

  const prefetchRoute = (route: string) => {
    if (!process.client || !route || route === '#') return
    void preloadRouteComponents(route)
  }

  const schedulePrefetchFromStorage = (limit = DEFAULT_PREFETCH_LIMIT) => {
    if (!process.client) return

    const run = () => {
      try {
        const raw = localStorage.getItem('auth_menu')
        if (!raw) return
        void prefetchFromMenu(JSON.parse(raw) as AuthMenu[], limit)
      } catch {
        /* noop */
      }
    }

    if ('requestIdleCallback' in window) {
      requestIdleCallback(run, { timeout: 4000 })
    } else {
      setTimeout(run, 1500)
    }
  }

  return {
    prefetchRoutes,
    prefetchFromMenu,
    prefetchRoute,
    schedulePrefetchFromStorage,
  }
}
