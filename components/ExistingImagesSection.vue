<template>
  <div>
    <div class="flex justify-between items-center mb-2">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Imágenes existentes
      </label>
      <div class="flex gap-2">
        <UButton 
          :label="`Eliminar seleccionadas (${selectedCount})`" 
          icon="i-heroicons-trash"
          size="xs"
          color="error"
          variant="outline"
          @click="$emit('delete-selected')"
          :disabled="selectedCount === 0"
        />
        <UButton 
          label="Deseleccionar todas" 
          icon="i-heroicons-x-mark"
          size="xs"
          color="neutral"
          variant="outline"
          @click="$emit('deselect-all')"
          :disabled="selectedCount === 0"
        />
      </div>
    </div>
    <div class="flex gap-3 overflow-x-auto pb-2" style="display: flex; flex-direction: row; flex-wrap: nowrap; overflow-x: auto;">
      <div 
        v-for="(image, index) in images" 
        :key="image.id"
        class="relative flex-shrink-0 w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50 hover:border-red-500 transition-colors cursor-pointer"
        :class="{ 'border-red-500 bg-red-50': selectedImages.includes(image.id) }"
        @click="$emit('toggle-selection', image.id)"
        style="flex-shrink: 0; width: 128px; height: 128px; min-width: 128px;"
      >
        <img 
          :src="getImageUrl(image.ruta)" 
          :alt="image.nombre_original"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
          <UIcon 
            :name="selectedImages.includes(image.id) ? 'i-heroicons-check' : 'i-heroicons-trash'" 
            class="w-6 h-6 text-white opacity-0 hover:opacity-100 transition-opacity"
          />
        </div>
        <div v-if="selectedImages.includes(image.id)" class="absolute top-2 right-2">
          <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-red-600 bg-white rounded-full" />
        </div>
      </div>
    </div>
    <!-- Debug info -->
    
  </div>
</template>

<script setup lang="ts">
interface ExistingImage {
  id: number
  id_regulacion: number
  extension: string
  peso: number
  nombre_original: string
  ruta: string
  created_at: string
  updated_at: string
}

interface Props {
  images: ExistingImage[]
  selectedImages: number[]
  selectedCount: number
}

defineProps<Props>()
defineEmits<{
  'toggle-selection': [imageId: number]
  'delete-selected': []
  'deselect-all': []
}>()

const getImageUrl = (ruta: string) => {
    return `${ruta}`
}
</script> 