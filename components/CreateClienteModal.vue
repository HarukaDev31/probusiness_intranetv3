<template>
  <UModal :open="isOpen" @close="closeModal">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            Subir Base de Datos de Clientes
          </h3>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-x-mark-20-solid"
            class="-my-1"
            @click="closeModal"
          />
        </div>
      </template>

      <div class="space-y-4">
        <!-- Información -->
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
          <p class="text-sm text-blue-800 dark:text-blue-200">
            <strong>Nota:</strong> Seleccione un archivo Excel (.xlsx) o CSV (.csv) con la base de datos de clientes de años pasados.
          </p>
        </div>

        <!-- Selector de archivo -->
        <div>
          <label for="file" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Archivo de clientes *
          </label>
          <div class="flex items-center justify-center w-full">
            <label 
              for="file-upload" 
              class="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500"
              :class="{ 'border-red-300 bg-red-50': fileError }"
            >
              <div class="flex flex-col items-center justify-center pt-5 pb-6">
                <UIcon 
                  name="i-heroicons-cloud-arrow-up" 
                  class="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                />
                <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span class="font-semibold">Haga clic para subir</span> o arrastre y suelte
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Excel (.xlsx) o CSV (.csv) - Máximo 10MB
                </p>
              </div>
              <input 
                id="file-upload" 
                type="file" 
                class="hidden" 
                accept=".xlsx,.xls,.csv"
                @change="handleFileSelect"
              />
            </label>
          </div>
          
          <!-- Archivo seleccionado -->
          <div v-if="selectedFile" class="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <UIcon name="i-heroicons-document-check" class="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                <span class="text-sm font-medium text-green-800 dark:text-green-200">
                  {{ selectedFile.name }}
                </span>
              </div>
              <UButton
                size="xs"
                color="error"
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="removeFile"
              />
            </div>
            <p class="text-xs text-green-600 dark:text-green-400 mt-1">
              Tamaño: {{ formatFileSize(selectedFile.size) }}
            </p>
          </div>

          <!-- Error de archivo -->
          <div v-if="fileError" class="mt-2 text-sm text-red-600 dark:text-red-400">
            {{ fileError }}
          </div>
        </div>

        <!-- Información adicional -->
        <div class="text-sm text-gray-600 dark:text-gray-400">
          <p class="mb-2"><strong>Formato esperado del archivo:</strong></p>
          <ul class="list-disc list-inside space-y-1 ml-2">
            <li>Columna A: Nombre completo</li>
            <li>Columna B: DNI/RUC</li>
            <li>Columna C: Correo electrónico</li>
            <li>Columna D: WhatsApp</li>
            <li>Columna E: Servicio (Consolidado/Curso)</li>
            <li>Columna F: Fecha (opcional)</li>
          </ul>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            color="neutral"
            variant="outline"
            @click="closeModal"
            :disabled="loading"
          >
            Cancelar
          </UButton>
          <UButton
            color="primary"
            @click="handleSubmit"
            :loading="loading"
            :disabled="loading || !selectedFile"
          >
            Subir Archivo
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'update:isOpen', value: boolean): void
  (e: 'uploaded', file: File): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const selectedFile = ref<File | null>(null)
const fileError = ref('')
const loading = ref(false)

// File validation
const validateFile = (file: File): boolean => {
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    fileError.value = 'El archivo es demasiado grande. Máximo 10MB.'
    return false
  }

  // Check file type
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
    'application/csv' // .csv alternative
  ]
  
  if (!allowedTypes.includes(file.type)) {
    fileError.value = 'Tipo de archivo no válido. Use Excel (.xlsx, .xls) o CSV (.csv).'
    return false
  }

  fileError.value = ''
  return true
}

// Handle file selection
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    if (validateFile(file)) {
      selectedFile.value = file
    } else {
      selectedFile.value = null
      // Reset input
      target.value = ''
    }
  }
}

// Remove selected file
const removeFile = () => {
  selectedFile.value = null
  fileError.value = ''
  // Reset input
  const input = document.getElementById('file-upload') as HTMLInputElement
  if (input) {
    input.value = ''
  }
}



// Handle form submission
const handleSubmit = async () => {
  if (!selectedFile.value) {
    fileError.value = 'Por favor seleccione un archivo.'
    return
  }

  loading.value = true

  try {
    // Emit the file to parent component
    emit('uploaded', selectedFile.value)
    closeModal()
  } catch (error) {
    console.error('Error uploading file:', error)
    fileError.value = 'Error al procesar el archivo. Intente nuevamente.'
  } finally {
    loading.value = false
  }
}

// Close modal
const closeModal = () => {
  emit('update:isOpen', false)
  resetForm()
}

// Reset form
const resetForm = () => {
  selectedFile.value = null
  fileError.value = ''
  loading.value = false
  // Reset input
  const input = document.getElementById('file-upload') as HTMLInputElement
  if (input) {
    input.value = ''
  }
}

// Watch for modal close to reset form
watch(() => props.isOpen, (newValue) => {
  if (!newValue) {
    resetForm()
  }
})
</script> 