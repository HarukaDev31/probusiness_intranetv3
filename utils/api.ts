// Configuración de la API
export const API_CONFIG = {
  baseURL: useRuntimeConfig().public.apiBaseUrl,
  timeout: 60*1000,
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
  // Emitir evento global para mostrar modal
  if (process.client) {
    window.dispatchEvent(new CustomEvent('session-expired'))
  }
}

// Función para hacer llamadas a la API con configuración consistente
export const apiCall = async <T>(
  endpoint: string, 
  options: any = {}
): Promise<T> => {
  try {
    // Obtener el token de autenticación
    const token = getAuthToken()
    
    console.log('🔑 Token found:', token ? 'YES' : 'NO')
    console.log('🌐 Endpoint:', endpoint)
    console.log('🔧 Full URL would be:', API_CONFIG.baseURL + endpoint)
    
    // Determinar si es FormData para no establecer Content-Type manualmente
    const isFormData = options.body instanceof FormData
    
    const finalHeaders = {
      // Solo establecer Content-Type si no es FormData
      ...(isFormData ? {} : API_CONFIG.headers),
      // Agregar headers personalizados primero
      ...options.headers,
      // Agregar Bearer token al final para que siempre se incluya
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
    
    const config = {
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: finalHeaders,
      ...options
    }
    
    // Asegurar que los headers no se sobrescriban después
    config.headers = finalHeaders

    console.log('📋 Final headers:', config.headers)

    return await $fetch<T>(endpoint, config)
  } catch (error: any) {
    // Interceptar error 401 (Unauthorized) pero excluir el endpoint de login
    if ((error.status === 401 || error.statusCode === 401) && !endpoint.includes('/api/auth/login')) {
      handleSessionExpired()
    }
    
    // Re-lanzar el error para que sea manejado por el código que llamó a apiCall
    throw error
  }
}

// Función específica para autenticación
export const authApiCall = async <T>(
  endpoint: string,
  credentials: { No_Usuario: string; No_Password: string }
): Promise<T> => {
  return await apiCall<T>(endpoint, {
    method: 'POST',
    body: credentials
  })
}

// Función de prueba para simular error 401
export const test401Error = () => {
  console.log('Testing 401 error simulation')
  handleSessionExpired()
} 