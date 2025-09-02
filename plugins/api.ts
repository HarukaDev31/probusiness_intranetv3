export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  
  const API_CONFIG = {
    baseURL: config.public.apiBaseUrl,
    timeout: 3*60*1000,
    headers: {
      'Content-Type': 'application/json',
    }
  }

  // Función para obtener el token de autenticación
  const getAuthToken = (): string | null => {
    if (process.client) {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  // Función para manejar sesión expirada
  const handleSessionExpired = () => {
    if (process.client) {
      window.dispatchEvent(new CustomEvent('session-expired'))
    }
  }

  // Función para hacer llamadas a la API con configuración consistente
  const apiCall = async <T>(
    endpoint: string, 
    options: any = {}
  ): Promise<T> => {
    try {
      const token = getAuthToken()
      const isFormData = options.body instanceof FormData
      
      const finalHeaders = {
        ...(isFormData ? {} : API_CONFIG.headers),
        ...options.headers,
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
      
      const config = {
        baseURL: API_CONFIG.baseURL,
        timeout: API_CONFIG.timeout,
        headers: finalHeaders,
        ...options
      }
      
      config.headers = finalHeaders

      return await $fetch<T>(endpoint, config)
    } catch (error: any) {
      if ((error.status === 401 || error.statusCode === 401) && !endpoint.includes('/api/auth/login')) {
        handleSessionExpired()
      }
   
      throw error
    }
  }

  // Función específica para autenticación
  const authApiCall = async <T>(
    endpoint: string,
    credentials: { No_Usuario: string; No_Password: string }
  ): Promise<T> => {
    return await apiCall<T>(endpoint, {
      method: 'POST',
      body: credentials
    })
  }

  return {
    provide: {
      api: {
        call: apiCall,
        auth: authApiCall,
        config: API_CONFIG
      }
    }
  }
})
