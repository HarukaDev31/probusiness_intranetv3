import AuthService from '../services/authService'

export default defineNuxtPlugin({
  name: 'auth',
  dependsOn: ['websocket-events'],
  setup(nuxtApp) {
    const authService = AuthService.getInstance()
    authService.setNuxtApp(nuxtApp)
    // Echo/WebSocket se inicializan en websocket.client.ts tras el primer paint
    // (no await aquí: Nuxt espera los plugins async antes de montar la app).
  }
})
