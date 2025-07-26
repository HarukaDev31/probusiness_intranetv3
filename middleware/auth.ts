import AuthService from '../services/authService'

export default defineNuxtRouteMiddleware((to, from) => {
  // Permitir acceso libre solo a /login
  if (to.path === '/login') return

  const authService = AuthService.getInstance()
  if (!authService.isAuthenticated()) {
    return navigateTo('/login')
  }
}) 