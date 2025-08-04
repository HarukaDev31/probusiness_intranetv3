<template>
  <div class="container mx-auto p-8">
    <h1 class="text-3xl font-bold mb-8">Ejemplo de Modales Dinámicos</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button
        @click="showSuccessModal"
        class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
      >
        Mostrar Success Modal
      </button>
      
      <button
        @click="showErrorModal"
        class="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
      >
        Mostrar Error Modal
      </button>
      
      <button
        @click="showWarningModal"
        class="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors"
      >
        Mostrar Warning Modal
      </button>
      
      <button
        @click="showInfoModal"
        class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Mostrar Info Modal
      </button>
      
      <button
        @click="showMultipleModals"
        class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors md:col-span-2"
      >
        Mostrar Múltiples Modals
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { showSuccess, showError, showWarning, showInfo } = useModal()

const showSuccessModal = () => {
  showSuccess(
    'Operación Exitosa',
    'Los datos se han guardado correctamente en la base de datos.'
  )
}

const showErrorModal = () => {
  showError(
    'Error de Validación',
    'Por favor verifica que todos los campos requeridos estén completos.',
    { persistent: true }
  )
}

const showWarningModal = () => {
  showWarning(
    'Atención Requerida',
    'Esta acción no se puede deshacer. ¿Estás seguro de continuar?'
  )
}

const showInfoModal = () => {
  showInfo(
    'Información Importante',
    'Tu sesión expirará en 5 minutos. Guarda tu trabajo.',
    { duration: 3000 }
  )
}

const showMultipleModals = () => {
  setTimeout(() => showInfo('Modal 1', 'Primer modal'), 0)
  setTimeout(() => showSuccess('Modal 2', 'Segundo modal'), 500)
  setTimeout(() => showWarning('Modal 3', 'Tercer modal'), 1000)
}
</script> 