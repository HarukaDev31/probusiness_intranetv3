import AuthService from '../services/authService'
import { useSession } from '../composables/auth/useSession'

// Páginas solo para visitantes (login): con sesión activa se redirige al inicio.
export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return

  const { hasValidToken } = useSession()
  if (hasValidToken() && AuthService.getInstance().isAuthenticated()) {
    return navigateTo('/')
  }
})
