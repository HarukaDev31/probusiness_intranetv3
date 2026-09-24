import { ref, readonly, nextTick } from 'vue'

// Singleton instance
let spinnerInstance: ReturnType<typeof createSpinnerInstance> | null = null

function createSpinnerInstance() {
  const isSpinning = ref(false)
  const spinnerMessage = ref('Cargando...')
  /** Contador para withSpinner anidados / concurrentes: no ocultar si aún hay operaciones. */
  let pendingCount = 0

  const showSpinner = (message?: string) => {
    spinnerMessage.value = message || 'Cargando...'
    pendingCount += 1
    isSpinning.value = true
  }

  const hideSpinner = () => {
    pendingCount = Math.max(0, pendingCount - 1)
    if (pendingCount === 0) {
      isSpinning.value = false
      spinnerMessage.value = 'Cargando...'
    }
  }

  /** Fuerza cierre (p. ej. al cambiar de sección en el menú). */
  const resetSpinner = () => {
    pendingCount = 0
    isSpinning.value = false
    spinnerMessage.value = 'Cargando...'
  }

  const withSpinner = async <T>(
    operation: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    try {
      showSpinner(message)
      // Una pasada al DOM para que el overlay del spinner se pinte antes de operaciones muy rápidas
      await nextTick()
      const result = await operation()
      return result
    } finally {
      hideSpinner()
    }
  }

  return {
    isSpinning: readonly(isSpinning),
    spinnerMessage: readonly(spinnerMessage),
    showSpinner,
    hideSpinner,
    resetSpinner,
    withSpinner
  }
}

export const useSpinner = () => {
  if (!spinnerInstance) {
    spinnerInstance = createSpinnerInstance()
  }
  return spinnerInstance
}
