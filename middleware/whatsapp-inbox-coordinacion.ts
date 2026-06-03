import { useUserRole } from '~/composables/auth/useUserRole'
import { ROLES } from '~/constants/roles'

export default defineNuxtRouteMiddleware(() => {
  if (process.server) return

  const authUser = localStorage.getItem('auth_user')
  if (!authUser) {
    return navigateTo('/login')
  }

  const { hasRole, fetchCurrentUser, currentRole } = useUserRole()
  if (!currentRole.value) {
    fetchCurrentUser()
  }

  if (!hasRole(ROLES.COORDINACION)) {
    return navigateTo('/unauthorized')
  }
})
