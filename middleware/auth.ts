import AuthService from '../services/authService'

export default defineNuxtRouteMiddleware((to, from) => {
  // Permitir acceso libre solo a /login
  if (to.path === '/login') return

  const authService = AuthService.getInstance()
  const { hasValidToken } = useSession()
  
  // Verificar si hay token válido
  if (!hasValidToken() || !authService.isAuthenticated()) {
    // Si no hay token, redirigir al login
    return navigateTo('/login')
  }
}) 