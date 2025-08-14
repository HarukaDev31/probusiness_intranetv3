import AuthService from '../services/authService'
import { useSession } from '~/composables/auth/useSession'
export default defineNuxtRouteMiddleware((to, from) => {
  if (to.path === '/login') return

  const authService = AuthService.getInstance()
  const { hasValidToken } = useSession()
  
  if (!hasValidToken() || !authService.isAuthenticated()) {
    return navigateTo('/login')
  }
}) 