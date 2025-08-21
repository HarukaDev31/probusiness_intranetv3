import AuthService from '../services/authService'

export default defineNuxtPlugin(async (nuxtApp) => {
  const authService = AuthService.getInstance()
  authService.setNuxtApp(nuxtApp)
  
  // Inicializar Echo si hay una sesión existente
  if (process.client) {
    await authService.initializeEcho()
  }
})