export default defineNuxtRouteMiddleware((to) => {
  // Solo ejecutar en el cliente
  if (process.server) return

  const { currentRole, hasRole, hasAnyRole, fetchCurrentUser } = useUserRole()
  
  // Verificar si el usuario está autenticado
  const authUser = localStorage.getItem('auth_user')
  if (!authUser) {
    return navigateTo('/login')
  }

  // Cargar datos del usuario si no están disponibles
  if (!currentRole.value) {
    fetchCurrentUser()
  }

  // Control de acceso basado en rutas y roles
  const route = to.path

  // Rutas que requieren rol de Administrador
  if (route.startsWith('/admin') && !hasRole('Admin')) {
    return navigateTo('/unauthorized')
  }

  // Rutas que requieren rol de Documentación
  if (route.startsWith('/documentacion') && !hasRole('Documentacion')) {
    return navigateTo('/unauthorized')
  }

  // Rutas que requieren roles específicos
  if (route.startsWith('/reports') && !hasAnyRole(['Admin', 'Supervisor', 'Documentacion'])) {
    return navigateTo('/unauthorized')
  }

  // Rutas de gestión de productos (múltiples roles permitidos)
  if (route.startsWith('/basedatos/productos') && !hasAnyRole(['Admin', 'Supervisor', 'Documentacion', 'Comercial'])) {
    return navigateTo('/unauthorized')
  }

  // Rutas de regulaciones (roles específicos)
  if (route.startsWith('/basedatos/regulaciones') && !hasAnyRole(['Admin', 'Documentacion'])) {
    return navigateTo('/unauthorized')
  }
}) 