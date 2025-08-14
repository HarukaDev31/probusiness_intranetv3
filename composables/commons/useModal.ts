export interface ModalData {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'confirmation'
  title: string
  message: string
  duration?: number
  persistent?: boolean
  onConfirm?: () => void
  onCancel?: () => void
}

// Singleton instance
let modalInstance: ReturnType<typeof createModalInstance> | null = null

function createModalInstance() {
  const modals = ref<ModalData[]>([])

  const showModal = (data: Omit<ModalData, 'id'>) => {
    const id = Date.now().toString()
    const modal: ModalData = {
      id,
      duration: 5000,
      persistent: false,
      ...data
    }

    modals.value.push(modal)

    // Auto-remove modal if not persistent
    if (!modal.persistent && modal.duration) {
      setTimeout(() => {
        removeModal(id)
      }, modal.duration)
    }

    return id
  }

  const removeModal = (id: string) => {
    const index = modals.value.findIndex(modal => modal.id === id)
    if (index > -1) {
      modals.value.splice(index, 1)
    }
  }

  const clearAll = () => {
    modals.value = []
  }

  // Helper methods
  const showSuccess = (title: string, message: string, options?: Partial<ModalData>) => {
    return showModal({ type: 'success', title, message, ...options })
  }

  const showError = (title: string, message: string, options?: Partial<ModalData>) => {
    return showModal({ type: 'error', title, message, persistent: true, ...options })
  }

  const showWarning = (title: string, message: string, options?: Partial<ModalData>) => {
    return showModal({ type: 'warning', title, message, ...options })
  }

  const showInfo = (title: string, message: string, options?: Partial<ModalData>) => {
    return showModal({ type: 'info', title, message, ...options })
  }

  const showConfirmation = (
    title: string, 
    message: string, 
    onConfirm?: () => void,
    onCancel?: () => void,
    options?: Partial<ModalData>
  ) => {
    return showModal({ 
      type: 'confirmation', 
      title, 
      message, 
      onConfirm,
      onCancel,
      ...options 
    })
  }

  return {
    modals: readonly(modals),
    showModal,
    removeModal,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirmation
  }
}

export const useModal = () => {
  if (!modalInstance) {
    modalInstance = createModalInstance()
  }
  return modalInstance
} 