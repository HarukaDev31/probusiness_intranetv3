import AuthService from '../services/authService'

export default defineNuxtRouteMiddleware((to, from) => {
  if (to.path === '/login') return

  const authService = AuthService.getInstance()
  const { hasValidToken } = useSession()
  
  if (!hasValidToken() || !authService.isAuthenticated()) {
    return navigateTo('/login')
  }
}) 