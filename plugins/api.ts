export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const pendingRequests = new Map<number, AbortController>()
  let requestSeq = 0
  
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

  const abortAllPendingRequests = () => {
    pendingRequests.forEach((controller) => {
      try {
        controller.abort()
      } catch (_e) {
        // ignore
      }
    })
    pendingRequests.clear()
  }

  const getTopLevelModule = (path: string): string => {
    const cleanPath = (path || '').split('?')[0]
    return cleanPath.split('/').filter(Boolean)[0] || ''
  }

  if (process.client) {
    const router = useRouter()
    router.beforeEach((to, from) => {
      const fromModule = getTopLevelModule(from.path || '')
      const toModule = getTopLevelModule(to.path || '')
      if (fromModule && toModule && fromModule !== toModule) {
        abortAllPendingRequests()
      }
      return true
    })
  }

  // Función para hacer llamadas a la API con configuración consistente
  const apiCall = async <T>(
    endpoint: string, 
    options: any = {}
  ): Promise<T> => {
    const requestId = ++requestSeq
    const requestController = new AbortController()
    pendingRequests.set(requestId, requestController)

    const externalSignal = options?.signal as AbortSignal | undefined
    let cleanupExternalAbort: (() => void) | null = null

    if (externalSignal) {
      if (externalSignal.aborted) {
        requestController.abort()
      } else {
        const onExternalAbort = () => requestController.abort()
        externalSignal.addEventListener('abort', onExternalAbort, { once: true })
        cleanupExternalAbort = () => {
          externalSignal.removeEventListener('abort', onExternalAbort)
        }
      }
    }

    try {
      const token = getAuthToken()
      const isFormData = options.body instanceof FormData
      const finalHeaders: Record<string, string> = {
        ...(isFormData ? {} : API_CONFIG.headers),
        ...options.headers,
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
      // Con FormData el navegador debe asignar Content-Type con boundary; no fijarlo aquí
      if (isFormData) delete finalHeaders['Content-Type']
      
      const fetchConfig = {
        baseURL: API_CONFIG.baseURL,
        timeout: API_CONFIG.timeout,
        headers: finalHeaders,
        cache: 'no-store' as RequestCache,
        ...options,
        signal: requestController.signal
      }
      
      fetchConfig.headers = finalHeaders

      return await $fetch<T>(endpoint, fetchConfig)
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw error
      }
      if ((error.status === 401 || error.statusCode === 401) && !endpoint.includes('/api/auth/login')) {
        handleSessionExpired()
      }
   
      throw error
    } finally {
      pendingRequests.delete(requestId)
      if (cleanupExternalAbort) {
        cleanupExternalAbort()
      }
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
        config: API_CONFIG,
        abortAllPendingRequests
      }
    }
  }
})
