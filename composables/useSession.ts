import { ref } from 'vue'

export const useSession = () => {
  const isSessionExpired = ref(false)

  // Función para limpiar todos los datos de sesión
  const clearSession = () => {
    if (process.client) {
      // Limpiar localStorage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      
      // Limpiar sessionStorage si lo usas
      sessionStorage.clear()
      
      // Limpiar cookies si las usas
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })
      
      console.log('Sesión limpiada completamente')
    }
  }

  // Función para manejar sesión expirada
  const handleSessionExpired = () => {
    console.log('Sesión expirada detectada')
    isSessionExpired.value = true
    clearSession()
    
    // Emitir evento global
    if (process.client) {
      window.dispatchEvent(new CustomEvent('session-expired'))
    }
  }

  // Función para verificar si hay token válido
  const hasValidToken = (): boolean => {
    if (process.client) {
      const token = localStorage.getItem('auth_token')
      return !!token
    }
    return false
  }

  // Función para obtener el token
  const getToken = (): string | null => {
    if (process.client) {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  // Función para establecer el token
  const setToken = (token: string) => {
    if (process.client) {
      localStorage.setItem('auth_token', token)
    }
  }

  // Función para obtener datos del usuario
  const getUserData = () => {
    if (process.client) {
      const userData = localStorage.getItem('user_data')
      return userData ? JSON.parse(userData) : null
    }
    return null
  }

  // Función para establecer datos del usuario
  const setUserData = (userData: any) => {
    if (process.client) {
      localStorage.setItem('user_data', JSON.stringify(userData))
    }
  }

  return {
    isSessionExpired,
    clearSession,
    handleSessionExpired,
    hasValidToken,
    getToken,
    setToken,
    getUserData,
    setUserData
  }
} 