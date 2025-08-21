<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          <UIcon name="i-heroicons-photo" class="mr-2" />
          Inspección
        </h2>
      </div>
    </template>

    <FileUploader ref="fileUploaderRef" :disabled="disabled" :loading="loading" :multiple="true" @files-selected="handleFilesSelected" :initial-files="files"
      @file-removed="handleFileRemoved" />
  </UCard>
</template>

<script setup lang="ts">
import type { FileItem } from '../types/commons/file'
import FileUploader from './commons/FileUploader.vue'
interface Props {
  files: FileItem[]
  selectedFiles: File[]
  loading: boolean
  disabled: boolean
}

interface Emits {
  (e: 'files-selected', files: File[]): void
  (e: 'download-file', url: string | null): void
  (e: 'delete-file', id: number): void
  (e: 'save'): void
  (e: 'file-removed', id: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const fileUploaderRef = ref()

const handleFilesSelected = (files: File[]) => {
  emit('files-selected', files)
  // Limpiar archivos seleccionados después de emitir
  if (fileUploaderRef.value) {
    fileUploaderRef.value.clearSelectedFiles()
  }
}



const handleFileRemoved = (id: number) => {
  emit('file-removed', id)
  console.log('id', id)
}
</script>

<style scoped>

</style>
