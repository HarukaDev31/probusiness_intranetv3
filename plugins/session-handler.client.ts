import { useSession } from '~/composables/auth/useSession'
export default defineNuxtPlugin(() => {
  const { clearSession } = useSession()

  // Escuchar el evento de sesión expirada globalmente
  if (process.client) {
    window.addEventListener('session-expired', () => {
      clearSession()
    })
  }
}) 