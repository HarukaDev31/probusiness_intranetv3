import { useUserRole } from '~/composables/auth/useUserRole'
import { WA_INBOX_ALLOWED_ROLES } from '~/constants/whatsappInboxAccess'

export default defineNuxtRouteMiddleware(() => {
  if (process.server) return

  const authUser = localStorage.getItem('auth_user')
  if (!authUser) {
    return navigateTo('/login')
  }

  const { hasAnyRole, fetchCurrentUser, currentRole } = useUserRole()
  if (!currentRole.value) {
    fetchCurrentUser()
  }

  if (!hasAnyRole(WA_INBOX_ALLOWED_ROLES)) {
    return navigateTo('/unauthorized')
  }
})
