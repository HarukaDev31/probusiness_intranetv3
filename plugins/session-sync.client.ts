import AuthService from '../services/authService'

// El evento `storage` solo se dispara en las OTRAS pestañas: sirve para propagar login/logout entre ellas.
export default defineNuxtPlugin(() => {
  const router = useRouter()

  window.addEventListener('storage', (event: StorageEvent) => {
    // key === null: otra pestaña ejecutó localStorage.clear()
    if (event.key !== null && event.key !== 'auth_token') return

    const hasToken = !!localStorage.getItem('auth_token')
    const onLogin = router.currentRoute.value.path === '/login'

    if (!hasToken && !onLogin) {
      void AuthService.getInstance().logout()
      void router.push('/login')
    } else if (hasToken && onLogin) {
      // Recarga completa para que AuthService lea la sesión nueva desde localStorage.
      window.location.assign('/')
    }
  })
})
