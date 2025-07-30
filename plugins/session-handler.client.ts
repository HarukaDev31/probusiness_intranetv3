export default defineNuxtPlugin(() => {
  const { clearSession } = useSession()

  // Escuchar el evento de sesión expirada globalmente
  if (process.client) {
    window.addEventListener('session-expired', () => {
      console.log('Plugin: Sesión expirada detectada, limpiando datos...')
      clearSession()
    })
  }
}) 