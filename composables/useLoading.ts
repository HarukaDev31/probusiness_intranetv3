import { ref, readonly } from 'vue'

// Estados de carga globales
const globalLoading = ref(false)
const loadingStates = ref<Record<string, boolean>>({})
const loadingMessages = ref<Record<string, string>>({})

export const useLoading = () => {
  const setGlobalLoading = (loading: boolean, message?: string) => {
    globalLoading.value = loading
    if (message) {
      loadingMessages.value['global'] = message
    }
  }

  const setLoading = (key: string, loading: boolean, message?: string) => {
    loadingStates.value[key] = loading
    if (message) {
      loadingMessages.value[key] = message
    } else if (!loading) {
      delete loadingMessages.value[key]
    }
  }

  const isLoading = (key?: string): boolean => {
    if (key) {
      return loadingStates.value[key] || false
    }
    return globalLoading.value
  }

  const getLoadingMessage = (key?: string): string => {
    if (key) {
      return loadingMessages.value[key] || ''
    }
    return loadingMessages.value['global'] || 'Cargando...'
  }

  const clearLoading = (key?: string) => {
    if (key) {
      delete loadingStates.value[key]
      delete loadingMessages.value[key]
    } else {
      globalLoading.value = false
      delete loadingMessages.value['global']
    }
  }

  const clearAllLoading = () => {
    globalLoading.value = false
    loadingStates.value = {}
    loadingMessages.value = {}
  }

  // Wrapper para operaciones asíncronas con loading automático
  const withLoading = async <T>(
    operation: () => Promise<T>,
    key: string,
    message?: string
  ): Promise<T> => {
    try {
      setLoading(key, true, message)
      const result = await operation()
      return result
    } finally {
      setLoading(key, false)
    }
  }

  const withGlobalLoading = async <T>(
    operation: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    try {
      setGlobalLoading(true, message)
      const result = await operation()
      return result
    } finally {
      setGlobalLoading(false)
    }
  }

  return {
    // Estado
    globalLoading: readonly(globalLoading),
    loadingStates: readonly(loadingStates),
    loadingMessages: readonly(loadingMessages),

    // Métodos
    setGlobalLoading,
    setLoading,
    isLoading,
    getLoadingMessage,
    clearLoading,
    clearAllLoading,
    withLoading,
    withGlobalLoading
  }
} 