<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Test Spinner</h1>
    
    <div class="space-y-4">
      <UButton @click="testShowSpinner" color="primary">
        Mostrar Spinner (3 segundos)
      </UButton>
      
      <UButton @click="testWithSpinner" color="success">
        Test withSpinner (2 segundos)
      </UButton>
      
      <UButton @click="testHideSpinner" color="error">
        Ocultar Spinner
      </UButton>
    </div>
    
    <div class="mt-8 p-4 bg-gray-100 rounded">
      <h3 class="font-semibold mb-2">Estado del Spinner:</h3>
      <p>Visible: {{ isSpinning ? 'Sí' : 'No' }}</p>
      <p>Mensaje: {{ spinnerMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isSpinning, spinnerMessage, showSpinner, hideSpinner, withSpinner } = useSpinner()

const testShowSpinner = () => {
  showSpinner('Probando spinner...')
  setTimeout(() => {
    hideSpinner()
  }, 3000)
}

const testWithSpinner = async () => {
  await withSpinner(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    
  }, 'Operación en progreso...')
}

const testHideSpinner = () => {
  hideSpinner()
}
</script> 