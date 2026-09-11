import type { AuthMenu } from '~/services/authService'
import { collectMenuRoutes } from '~/utils/menuRoutes'

export const WA_INBOX_MENU_PATH = '/coordinacion/whatsapp-inbox'

export function hasWhatsappInboxMenuAccess(menuRoutes: string[] = []): boolean {
  return menuRoutes.some(
    (route) => route === WA_INBOX_MENU_PATH || route.startsWith(`${WA_INBOX_MENU_PATH}/`)
  )
}

export function hasWhatsappInboxMenuFromStorage(): boolean {
  if (typeof localStorage === 'undefined') return false
  try {
    const stored = localStorage.getItem('auth_menu')
    if (!stored) return false
    return hasWhatsappInboxMenuAccess(collectMenuRoutes(JSON.parse(stored) as AuthMenu[]))
  } catch {
    return false
  }
}
