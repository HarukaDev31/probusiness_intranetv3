import { useUserRole } from "~/composables/auth/useUserRole"

// Cache para evitar verificaciones repetidas en la misma sesión
let cachedRole: string | null = null
let lastAuthCheck: number = 0
const CACHE_DURATION = 5000 // 5 segundos

export default defineNuxtRouteMiddleware((to) => {
  // Solo ejecutar en el cliente
  if (process.server) return

  const { currentRole, hasRole, hasAnyRole, fetchCurrentUser } = useUserRole()
  
  // Verificar si el usuario está autenticado (solo una vez por sesión o cada 5 segundos)
  const now = Date.now()
  if (now - lastAuthCheck > CACHE_DURATION || !cachedRole) {
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) {
      return navigateTo('/login')
    }

    // Cargar datos del usuario si no están disponibles
    if (!currentRole.value) {
      fetchCurrentUser()
    }

    // Cachear el rol
    cachedRole = currentRole.value
    lastAuthCheck = now
  }

  // Solo verificar rutas protegidas (evitar verificaciones innecesarias)
  const route = to.path
  
  // Lista de rutas protegidas - solo verificar si la ruta actual está en la lista
  const protectedRoutes = {
    '/admin': () => hasRole('Admin'),
    '/documentacion': () => hasRole('Documentacion'),
    '/reports': () => hasAnyRole(['Admin', 'Supervisor', 'Documentacion']),
    '/basedatos/productos': () => hasAnyRole(['Admin', 'Supervisor', 'Documentacion', 'Comercial']),
    '/basedatos/regulaciones': () => hasAnyRole(['Admin', 'Documentacion'])
  }

  // Verificar solo si la ruta está protegida
  for (const [pathPrefix, checkAccess] of Object.entries(protectedRoutes)) {
    if (route.startsWith(pathPrefix)) {
      if (!checkAccess()) {
        return navigateTo('/unauthorized')
      }
      break // Solo verificar la primera coincidencia
    }
  }
}) 