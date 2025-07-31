import { ref, readonly } from 'vue'

interface NotificationConfig {
  title?: string
  subtitle?: string
  message: string
  details?: string
  showRetryButton?: boolean
  showSecondaryButton?: boolean
  secondaryButtonText?: string
  autoClose?: boolean
  duration?: number
}

// Estado global para las notificaciones
const showSuccessModal = ref(false)
const showErrorModal = ref(false)
const successConfig = ref<NotificationConfig>({
  title: '¡Éxito!',
  subtitle: 'Operación completada',
  message: '',
  autoClose: true,
  duration: 3000
})
const errorConfig = ref<NotificationConfig>({
  title: 'Error',
  subtitle: 'Algo salió mal',
  message: '',
  details: '',
  showRetryButton: false,
  autoClose: false
})

// Callbacks para acciones
let retryCallback: (() => void) | null = null
let secondaryActionCallback: (() => void) | null = null

export const useNotifications = () => {
  const showSuccess = (config: NotificationConfig) => {
    successConfig.value = {
      ...successConfig.value,
      ...config
    }
    showSuccessModal.value = true

    // Auto-close si está habilitado
    if (config.autoClose !== false) {
      setTimeout(() => {
        showSuccessModal.value = false
      }, config.duration || 3000)
    }
  }

  const showError = (config: NotificationConfig, onRetry?: () => void) => {
    errorConfig.value = {
      ...errorConfig.value,
      ...config
    }
    showErrorModal.value = true
    retryCallback = onRetry || null
  }

  const showSuccessWithSecondary = (
    config: NotificationConfig, 
    onSecondaryAction?: () => void
  ) => {
    successConfig.value = {
      ...successConfig.value,
      ...config,
      showSecondaryButton: true,
      autoClose: false
    }
    showSuccessModal.value = true
    secondaryActionCallback = onSecondaryAction || null
  }

  const closeSuccessModal = () => {
    showSuccessModal.value = false
    secondaryActionCallback = null
  }

  const closeErrorModal = () => {
    showErrorModal.value = false
    retryCallback = null
  }

  const handleRetry = () => {
    if (retryCallback) {
      retryCallback()
    }
    closeErrorModal()
  }

  const handleSecondaryAction = () => {
    if (secondaryActionCallback) {
      secondaryActionCallback()
    }
    closeSuccessModal()
  }

  // Funciones de conveniencia para operaciones comunes
  const showCreateSuccess = (entityName: string) => {
    showSuccess({
      title: '¡Creado exitosamente!',
      subtitle: `${entityName} ha sido creado`,
      message: `El ${entityName.toLowerCase()} se ha creado correctamente y ya está disponible en el sistema.`
    })
  }

  const showUpdateSuccess = (entityName: string) => {
    showSuccess({
      title: '¡Actualizado exitosamente!',
      subtitle: `${entityName} ha sido actualizado`,
      message: `Los cambios en el ${entityName.toLowerCase()} se han guardado correctamente.`
    })
  }

  const showDeleteSuccess = (entityName: string) => {
    showSuccess({
      title: '¡Eliminado exitosamente!',
      subtitle: `${entityName} ha sido eliminado`,
      message: `El ${entityName.toLowerCase()} se ha eliminado correctamente del sistema.`
    })
  }

  const showNetworkError = (operation: string, onRetry?: () => void) => {
    showError({
      title: 'Error de conexión',
      subtitle: 'No se pudo completar la operación',
      message: `No se pudo ${operation.toLowerCase()}. Verifica tu conexión a internet e intenta nuevamente.`,
      showRetryButton: true
    }, onRetry)
  }

  const showValidationError = (message: string) => {
    showError({
      title: 'Error de validación',
      subtitle: 'Datos incorrectos',
      message: message
    })
  }

  const showServerError = (operation: string, details?: string, onRetry?: () => void) => {
    showError({
      title: 'Error del servidor',
      subtitle: 'Problema interno',
      message: `No se pudo ${operation.toLowerCase()}. El servidor ha devuelto un error.`,
      details: details,
      showRetryButton: true
    }, onRetry)
  }

  return {
    // Estado
    showSuccessModal: readonly(showSuccessModal),
    showErrorModal: readonly(showErrorModal),
    successConfig: readonly(successConfig),
    errorConfig: readonly(errorConfig),

    // Métodos principales
    showSuccess,
    showError,
    showSuccessWithSecondary,
    closeSuccessModal,
    closeErrorModal,
    handleRetry,
    handleSecondaryAction,

    // Métodos de conveniencia
    showCreateSuccess,
    showUpdateSuccess,
    showDeleteSuccess,
    showNetworkError,
    showValidationError,
    showServerError
  }
} 