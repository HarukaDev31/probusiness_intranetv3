<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          Documentación
          <UIcon name="i-heroicons-folder-open" class="mr-2" />

        </h2>
      </div>
    </template>

    <!-- Archivos existentes -->
  
    <FileUploader 
    :loading="loading"
    :disabled="disabled"
    :immediate="false"
    :multiple="true" @files-selected="handleFilesSelected"
      :initial-files="files" @file-removed="handleFileRemoved" :show-remove-button="showRemoveButton" />

  </UCard>
</template>

<script setup lang="ts">
import type { FileItem } from '../types/commons/file'
import ModalPreview from './commons/ModalPreview.vue'
import FileUploader from './commons/FileUploader.vue'

interface Emits {
  (e: 'files-selected', files: File[]): void
  (e: 'download-file', url: string | null): void
  (e: 'delete-file', id: number): void
}

const props = defineProps<{
  files: FileItem[]
  selectedFiles: File[]
  loading: boolean
  disabled: boolean
  showRemoveButton: boolean
}>()

const emit = defineEmits<Emits>()

const handleFilesSelected = (files: File[]) => {
  emit('files-selected', files)
  
}

const handleFileRemoved = (id: number) => {
  emit('delete-file', id)
  console.log('id', id)
}

</script>

<style scoped>

</style>
