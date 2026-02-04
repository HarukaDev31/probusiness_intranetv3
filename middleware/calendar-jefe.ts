import { useUserRole } from "~/composables/auth/useUserRole"
import { ROLES } from "~/constants/roles"

/**
 * Middleware para rutas del calendario que solo puede acceder el Jefe de Importaciones
 * 
 * Rutas protegidas:
 * - /calendar/actividades
 * - /calendar/colores  
 * - /calendar/config
 * 
 * Rutas permitidas para todos:
 * - /calendar (index)
 * - /calendar/progreso
 */
export default defineNuxtRouteMiddleware((to) => {
  // Solo ejecutar en el cliente
  if (process.server) return

  const { currentRole } = useUserRole()
  
  // Verificar autenticación
  const authUser = localStorage.getItem('auth_user')
  if (!authUser) {
    return navigateTo('/login')
  }

  // Solo el Jefe de Importaciones puede acceder a estas rutas
  if (currentRole.value !== ROLES.JEFE_IMPORTACIONES) {
    // Redirigir a la página de progreso (que sí pueden ver)
    return navigateTo('/calendar/progreso')
  }
})
