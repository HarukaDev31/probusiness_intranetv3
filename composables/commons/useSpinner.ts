// Singleton instance
let spinnerInstance: ReturnType<typeof createSpinnerInstance> | null = null

function createSpinnerInstance() {
  const isSpinning = ref(false)
  const spinnerMessage = ref('Cargando...')

  const showSpinner = (message?: string) => {
    spinnerMessage.value = message || 'Cargando...'
    isSpinning.value = true
  }

  const hideSpinner = () => {
    console.log('✅ Hiding spinner')
    isSpinning.value = false
    spinnerMessage.value = 'Cargando...'
  }

  const withSpinner = async <T>(
    operation: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    try {
      showSpinner(message)
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
    withSpinner
  }
}

export const useSpinner = () => {
  if (!spinnerInstance) {
    spinnerInstance = createSpinnerInstance()
  }
  return spinnerInstance
} 