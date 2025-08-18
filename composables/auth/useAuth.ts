import type { AuthUser, AuthMenu, LoginCredentials, LoginResponse } from '../../services/authService'
import AuthService from '../../services/authService'

export const useAuth = () => {
  const user = ref<AuthUser | null>(null)
  const isAuthenticated = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const menu = ref<AuthMenu[]>([])

  const authService = AuthService.getInstance()

  // Initialize auth state
  const initializeAuth = async () => {
    user.value = await authService.getCurrentUser()
    menu.value = authService.getMenu()
    isAuthenticated.value = !!user.value
  }

  // Login function
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response: LoginResponse = await authService.login(credentials)
      if (response.success && response.data) {
        user.value = response.data.user as AuthUser
        isAuthenticated.value = true
        menu.value = authService.getMenu()
        return true
      } else {
        error.value = response.error || 'Error al iniciar sesión'
        return false
      }
    } catch (err) {
      error.value = 'Error de conexión'
      return false
    } finally {
      loading.value = false
    }
  }

  // Logout function
  const logout = async () => {
    loading.value = true
    try {
      await authService.logout()
      user.value = null
      isAuthenticated.value = false
      menu.value = []
      await navigateTo('/login')
    } catch (err) {
      console.error('Error during logout:', err)
    } finally {
      loading.value = false
    }
  }

  // Get current user
  const getCurrentUser = (): AuthUser | null => {
    return user.value
  }

  // Get menu
  const getMenu = (): AuthMenu[] => {
    return menu.value
  }

  // Check if user is authenticated
  const checkAuth = (): boolean => {
    return isAuthenticated.value
  }
  const getToken = (): string | null => {
    return authService.getToken()
  }
  // Initialize on mount
  onMounted(() => {
    initializeAuth()
  })

  return {
    // State
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    loading: readonly(loading),
    error: readonly(error),
    menu: readonly(menu),

    // Methods
    login,
    logout,
    getCurrentUser,
    getMenu,
    checkAuth,
    getToken,
    initializeAuth
  }
} 