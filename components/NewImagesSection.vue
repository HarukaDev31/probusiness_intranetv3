<template>
  <div>
    <div class="flex justify-between items-center mb-2">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Agregar nuevas imágenes
      </label>
      <UButton 
        label="Agregar imagen" 
        icon="i-heroicons-plus"
        size="xs"
        @click="$emit('add-slot')"
      />
    </div>
    <div class="flex gap-3 overflow-x-auto pb-2" style="display: flex; flex-direction: row; flex-wrap: nowrap; overflow-x: auto;">
      <div 
        v-for="(slot, index) in imageSlots" 
        :key="index"
        class="flex-shrink-0 w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
        @click="$emit('select-image', index)"
        style="flex-shrink: 0; width: 128px; height: 128px; min-width: 128px;"
      >
        <div v-if="!slot.file" class="text-center">
          <UIcon name="i-heroicons-photo" class="w-8 h-8 text-gray-400 mx-auto mb-1" />
          <span class="text-xs text-gray-500">Agregar imagen</span>
        </div>
        <div v-else class="relative w-full h-full">
          <img 
            :src="slot.preview || ''" 
            :alt="`Imagen ${index + 1}`"
            width="128"
            height="128"
            class="w-full h-full object-cover rounded-lg"
          />
          <button
            @click.stop="$emit('remove-slot', index)"
            aria-label="Eliminar imagen"
            class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
            title="Eliminar imagen"
          >
            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ImageSlot {
  file: File | null
  preview: string | null
}

interface Props {
  imageSlots: ImageSlot[]
}

defineProps<Props>()
defineEmits<{
  'add-slot': []
  'select-image': [index: number]
  'remove-slot': [index: number]
}>()
</script> 