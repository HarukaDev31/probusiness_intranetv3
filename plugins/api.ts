import type { Router } from 'vue-router'

/**
 * Cliente API central ($fetch).
 * - Cancela peticiones en vuelo al cambiar de ruta para no saturar el pool de conexiones HTTP
 *   ni dejar spinners/colas bloqueadas al salir de una vista.
 * - Pasa `skipAbortOnNavigation: true` en options en subidas largas o llamadas que deben completar al navegar.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  const API_CONFIG = {
    baseURL: config.public.apiBaseUrl,
    // 3 min mantenía conexiones ocupadas demasiado tiempo; 2 min sigue siendo amplio para reportes pesados
    timeout: 2 * 60 * 1000,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  const pendingControllers = new Set<AbortController>()

  const abortPendingApiRequests = () => {
    pendingControllers.forEach((c) => {
      try {
        c.abort()
      } catch {
        /* ignore */
      }
    })
    pendingControllers.clear()
  }

  if (process.client) {
    const router = nuxtApp.$router as Router
    router.beforeEach(() => {
      abortPendingApiRequests()
    })
  }

  const mergeAbortSignals = (a: AbortSignal, b?: AbortSignal): AbortSignal => {
    if (!b) return a
    if (a.aborted || b.aborted) {
      const c = new AbortController()
      c.abort()
      return c.signal
    }
    const merged = new AbortController()
    const onAbort = () => {
      merged.abort()
    }
    a.addEventListener('abort', onAbort, { once: true })
    b.addEventListener('abort', onAbort, { once: true })
    return merged.signal
  }

  const getAuthToken = (): string | null => {
    if (process.client) {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  const handleSessionExpired = () => {
    if (process.client) {
      window.dispatchEvent(new CustomEvent('session-expired'))
    }
  }

  const apiCall = async <T>(endpoint: string, options: any = {}): Promise<T> => {
    const {
      skipAbortOnNavigation = false,
      signal: userSignal,
      ...restOptions
    } = options

    const navigationController = new AbortController()
    if (process.client && !skipAbortOnNavigation) {
      pendingControllers.add(navigationController)
    }

    const signal = mergeAbortSignals(navigationController.signal, userSignal)

    try {
      const token = getAuthToken()
      const isFormData = restOptions.body instanceof FormData
      const finalHeaders: Record<string, string> = {
        ...(isFormData ? {} : API_CONFIG.headers),
        ...restOptions.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      }
      if (isFormData) delete finalHeaders['Content-Type']

      const fetchConfig = {
        baseURL: API_CONFIG.baseURL,
        timeout: API_CONFIG.timeout,
        headers: finalHeaders,
        cache: 'no-store' as RequestCache,
        signal,
        ...restOptions,
      }

      fetchConfig.headers = finalHeaders

      return await $fetch<T>(endpoint, fetchConfig)
    } catch (error: any) {
      const isAbort =
        error?.name === 'AbortError' ||
        error?.cause?.name === 'AbortError' ||
        error?.message?.includes('aborted')

      if (isAbort) {
        throw error
      }

      if (
        (error.status === 401 || error.statusCode === 401) &&
        !endpoint.includes('/api/auth/login')
      ) {
        handleSessionExpired()
      }

      throw error
    } finally {
      if (process.client && !skipAbortOnNavigation) {
        pendingControllers.delete(navigationController)
      }
    }
  }

  const authApiCall = async <T>(
    endpoint: string,
    credentials: { No_Usuario: string; No_Password: string },
  ): Promise<T> => {
    return await apiCall<T>(endpoint, {
      method: 'POST',
      body: credentials,
    })
  }

  return {
    provide: {
      api: {
        call: apiCall,
        auth: authApiCall,
        config: API_CONFIG,
        /** Cancela manualmente todo lo en vuelo (p. ej. antes de logout explícito) */
        abortPending: abortPendingApiRequests,
      },
    },
  }
})
