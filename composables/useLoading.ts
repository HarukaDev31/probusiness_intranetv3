import { ref, readonly } from 'vue'

// Estados de carga globales
const globalLoading = ref(false)
const loadingStates = ref<Record<string, boolean>>({})
const loadingMessages = ref<Record<string, string>>({})

export const useLoading = () => {
  const isLoading = ref(false)
  const loadingMessage = ref('Cargando...')

  const showLoading = (message?: string) => {
    loadingMessage.value = message || 'Cargando...'
    isLoading.value = true
  }

  const hideLoading = () => {
    isLoading.value = false
    loadingMessage.value = 'Cargando...'
  }

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
    isLoading: readonly(isLoading),
    loadingMessage: readonly(loadingMessage),

    // Métodos
    setGlobalLoading,
    setLoading,
    isLoading,
    getLoadingMessage,
    clearLoading,
    clearAllLoading,
    withLoading,
    withGlobalLoading,
    showLoading,
    hideLoading
  }
} 