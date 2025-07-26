// Configuración de la API
export const API_CONFIG = {
  baseURL: useRuntimeConfig().public.apiBaseUrl,
  timeout: 10000,
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

// Función para hacer llamadas a la API con configuración consistente
export const apiCall = async <T>(
  endpoint: string, 
  options: any = {}
): Promise<T> => {
  // Obtener el token de autenticación
  const token = getAuthToken()
  
  const config = {
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: {
      ...API_CONFIG.headers,
      // Agregar Bearer token si existe
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  }

  return await $fetch<T>(endpoint, config)
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