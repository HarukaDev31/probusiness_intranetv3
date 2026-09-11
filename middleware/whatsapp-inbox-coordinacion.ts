export default defineNuxtRouteMiddleware(() => {
  if (process.server) return

  const authUser = localStorage.getItem('auth_user')
  const token = localStorage.getItem('auth_token')
  if (!authUser || !token) {
    return navigateTo('/login')
  }
})
