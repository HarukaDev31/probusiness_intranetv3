import AuthService from '../services/authService'

export default defineNuxtPlugin({
  name: 'auth',
  dependsOn: ['websocket-events'],
  async setup(nuxtApp) {
    const authService = AuthService.getInstance()
    authService.setNuxtApp(nuxtApp)

    if (process.client) {
      await authService.initializeEcho()
    }
  }
})
