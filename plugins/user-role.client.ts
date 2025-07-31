export default defineNuxtPlugin(() => {
  // Solo ejecutar en el cliente
  if (process.server) return

  // Crear una instancia global del composable
  const { fetchCurrentUser } = useUserRole()

  // Cargar datos del usuario al iniciar la aplicación
  fetchCurrentUser()

  // Opcional: También se puede cargar cuando se detecte un cambio en localStorage
  if (process.client) {
    window.addEventListener('storage', (event) => {
      if (event.key === 'auth_user') {
        fetchCurrentUser()
      }
    })
  }
}) 