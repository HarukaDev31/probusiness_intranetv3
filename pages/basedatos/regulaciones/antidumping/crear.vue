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
              Nueva Regulación Antidumping
            </h1>
            <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Completa la información de la nueva regulación antidumping
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

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descripción del Producto
          </label>
          <UTextarea 
            v-model="formData.descripcion"
            placeholder="Ingrese la descripción del producto..."
            :rows="3"
            class="w-full"
          />
        </div>

        <!-- Partida -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Partida
          </label>
          <UInput 
            v-model="formData.partida"
            placeholder="Ej: 6402999000"
            class="w-full"
          />
        </div>

        <!-- Price and Antidumping -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              P. declarado
            </label>
            <UInput 
              v-model="formData.precioDeclarado"
              type="number"
              step="0.01"
              placeholder="Ej: 7.5"
              icon="i-heroicons-currency-dollar"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Antidumping
            </label>
            <UInput 
              v-model="formData.antidumping"
              type="number"
              step="0.01"
              placeholder="Ej: 0.63"
              icon="i-heroicons-currency-dollar"
              class="w-full"
            />
          </div>
        </div>

        <!-- Images Upload -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Imágenes del producto
            </label>
            <UButton 
              label="Agregar imagen" 
              icon="i-heroicons-plus"
              size="xs"
              @click="addImageSlot"
            />
          </div>
          <div class="flex gap-3 overflow-x-auto pb-2">
            <div 
              v-for="(slot, index) in imageSlots" 
              :key="index"
              class="flex-shrink-0 w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              @click="selectImage(index)"
            >
              <div v-if="!slot.file" class="text-center">
                <UIcon name="i-heroicons-photo" class="w-8 h-8 text-gray-400 mx-auto mb-1" />
                <span class="text-xs text-gray-500">Agregar imagen</span>
              </div>
              <img 
                v-else 
                :src="slot.preview || ''" 
                :alt="`Imagen ${index + 1}`"
                class="w-full h-full object-cover rounded-lg"
              />
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
            placeholder="Agregar observaciones sobre el antidumping..."
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
  descripcion: '',
  partida: '',
  precioDeclarado: '',
  antidumping: '',
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

// Image slots
interface ImageSlot {
  file: File | null
  preview: string | null
}

const imageSlots = ref<ImageSlot[]>([
  { file: null, preview: null }
])

// Methods
const goBack = () => {
  router.back()
}

const addImageSlot = () => {
  imageSlots.value.push({ file: null, preview: null })
}

const selectImage = (index: number) => {
  // Crear un input file oculto
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  
  input.onchange = (event) => {
    const target = event.target as HTMLInputElement
    if (target.files && target.files[0]) {
      const file = target.files[0]
      const reader = new FileReader()
      
      reader.onload = (e) => {
        imageSlots.value[index] = {
          file: file,
          preview: e.target?.result as string
        }
      }
      
      reader.readAsDataURL(file)
    }
  }
  
  input.click()
}

const saveForm = async () => {
  try {
    console.log('Guardando regulación antidumping:', formData.value)
    console.log('Imágenes:', imageSlots.value)
    
    // Aquí iría la lógica para guardar en la API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mostrar notificación de éxito
    console.log('Regulación antidumping guardada exitosamente')
    
    // Redirigir de vuelta a la lista
    router.push('/basedatos/regulaciones')
    
  } catch (error) {
    console.error('Error al guardar:', error)
  }
}
</script> 