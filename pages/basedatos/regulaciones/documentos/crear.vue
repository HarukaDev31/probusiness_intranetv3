<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <UButton 
            label="Volver" 
            icon="i-heroicons-arrow-left"
            variant="outline"
            @click="goBack"
            class="mr-4"
          />
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <UIcon name="i-heroicons-plus-circle" class="text-blue-600 mr-3 text-2xl" />
              Nuevo Documento Especial
            </h1>
            <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Completa la información del nuevo documento especial
            </p>
          </div>
        </div>
        <UButton 
          label="Guardar" 
          icon="i-heroicons-document-arrow-down"
          color="primary"
          @click="saveForm"
        />
      </div>
    </div>

    <!-- Form -->
    <UCard>
      <div class="space-y-6">
        <!-- Product Selector -->
        <div class="max-w-md">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <UIcon name="i-heroicons-magnifying-glass" class="mr-1" />
            Producto Seleccionado
          </label>
          <USelect 
            v-model="formData.producto"
            :items="productOptions"
            placeholder="Seleccionar producto"
            class="w-full"
          />
        </div>

        <!-- Document Type -->
        <div class="max-w-md">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <UIcon name="i-heroicons-document" class="mr-1" />
            Tipo de Documento
          </label>
          <USelect 
            v-model="formData.tipoDocumento"
            :items="documentTypeOptions"
            placeholder="Seleccionar tipo"
            class="w-full"
          />
        </div>

        <!-- Requirements -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <UIcon name="i-heroicons-clipboard-document-list" class="mr-1" />
            Requisitos
          </label>
          <UTextarea 
            v-model="formData.requisitos"
            placeholder="Ingrese los requisitos del documento..."
            :rows="4"
            class="w-full"
          />
        </div>

        <!-- Documents Upload -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Documentos
            </label>
            <UButton 
              label="Agregar documento" 
              icon="i-heroicons-plus"
              size="xs"
              @click="addDocumentSlot"
            />
          </div>
          <div class="flex gap-3 overflow-x-auto pb-2">
            <div 
              v-for="(slot, index) in documentSlots" 
              :key="index"
              class="flex-shrink-0 w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              @click="selectDocument(index)"
            >
              <div v-if="!slot.file" class="text-center">
                <UIcon name="i-heroicons-document" class="w-8 h-8 text-gray-400 mx-auto mb-1" />
                <span class="text-xs text-gray-500">Agregar documento</span>
              </div>
              <div v-else class="text-center">
                <UIcon name="i-heroicons-document-check" class="w-8 h-8 text-green-500 mx-auto mb-1" />
                <span class="text-xs text-gray-600">{{ slot.file.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Observations -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Observaciones
          </label>
          <UTextarea 
            v-model="formData.observaciones"
            placeholder="Agregar observaciones sobre los documentos especiales..."
            :rows="3"
            class="w-full"
          />
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Router
const router = useRouter()

// Form data
const formData = ref({
  producto: '',
  tipoDocumento: '',
  requisitos: '',
  observaciones: ''
})

// Product options
const productOptions = [
  { label: 'Calzados', value: 'calzados' },
  { label: 'Motos Eléctricas', value: 'motos-electricas' },
  { label: 'Textiles', value: 'textiles' },
  { label: 'Electrónicos', value: 'electronicos' },
  { label: 'Juguetes', value: 'juguetes' }
]

// Document type options
const documentTypeOptions = [
  { label: 'Certificado Sanitario', value: 'sanitario' },
  { label: 'Permiso Ambiental', value: 'ambiental' },
  { label: 'Certificado de Calidad', value: 'calidad' },
  { label: 'Certificado de Origen', value: 'origen' },
  { label: 'Certificado de Seguridad', value: 'seguridad' },
  { label: 'Certificado de Conformidad', value: 'conformidad' }
]

// Document slots
interface DocumentSlot {
  file: File | null
}

const documentSlots = ref<DocumentSlot[]>([
  { file: null }
])

// Methods
const goBack = () => {
  router.back()
}

const addDocumentSlot = () => {
  documentSlots.value.push({ file: null })
}

const selectDocument = (index: number) => {
  // Crear un input file oculto
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png'
  
  input.onchange = (event) => {
    const target = event.target as HTMLInputElement
    if (target.files && target.files[0]) {
      const file = target.files[0]
      documentSlots.value[index] = { file: file }
    }
  }
  
  input.click()
}

const saveForm = async () => {
  try {
    console.log('Guardando documento especial:', formData.value)
    console.log('Documentos:', documentSlots.value)
    
    // Aquí iría la lógica para guardar en la API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mostrar notificación de éxito
    console.log('Documento especial guardado exitosamente')
    
    // Redirigir de vuelta a la lista
    router.push('/basedatos/regulaciones')
    
  } catch (error) {
    console.error('Error al guardar:', error)
  }
}
</script> 