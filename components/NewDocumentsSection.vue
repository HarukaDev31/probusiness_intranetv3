<template>
  <div>
    <div class="flex justify-between items-center mb-2">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Agregar nuevos documentos
      </label>
      <UButton 
        label="Agregar documento" 
        icon="i-heroicons-plus"
        size="xs"
        @click="$emit('add-slot')"
      />
    </div>
    <div class="flex gap-3 overflow-x-auto pb-2" style="display: flex; flex-direction: row; flex-wrap: nowrap; overflow-x: auto;">
      <div 
        v-for="(slot, index) in documentSlots" 
        :key="index"
        class="flex-shrink-0 w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
        @click="$emit('select-document', index)"
        style="flex-shrink: 0; width: 128px; height: 128px; min-width: 128px;"
      >
        <div v-if="!slot.file" class="text-center">
          <UIcon name="i-heroicons-document" class="w-8 h-8 text-gray-400 mx-auto mb-1" />
          <span class="text-xs text-gray-500">Agregar documento</span>
        </div>
        <div v-else class="relative w-full h-full">
          <div class="w-full h-full flex items-center justify-center bg-blue-50 rounded-lg">
            <UIcon name="i-heroicons-document-text" class="w-12 h-12 text-blue-600" />
          </div>
          <button
            @click.stop="$emit('remove-slot', index)"
            class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
            title="Eliminar documento"
          >
            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface DocumentSlot {
  file: File | null
  preview: string | null
}

interface Props {
  documentSlots: DocumentSlot[]
}

defineProps<Props>()
defineEmits<{
  'add-slot': []
  'select-document': [index: number]
  'remove-slot': [index: number]
}>()
</script> 