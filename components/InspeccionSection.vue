<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          <UIcon name="i-heroicons-photo" class="mr-2" />
          Inspección
        </h2>
        <UButton label="Guardar" icon="i-heroicons-save" color="warning" size="sm" @click="$emit('save')" />
      </div>
    </template>

    <!-- Archivos existentes -->
    <div v-if="files.length > 0" class="mb-4 space-y-2">
      <div v-for="file in files" :key="file.id" class="file-item">
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="flex items-center space-x-3">
            <ModalPreview :isOpen="showModal" :file="selectedFile" >

            <template #trigger>
              <UIcon :name="getFileIcon(file.file_name)" class="text-2xl text-gray-500" @click="openFileModal(file)" />
            </template>
            </ModalPreview>
            <div>
              <p class="font-medium text-gray-900 dark:text-white truncate max-w-xs">{{ file.file_name }}</p>
            </div>
          </div>
          <div class="flex space-x-2">
            <UButton icon="i-heroicons-arrow-down-tray" color="primary" variant="ghost" size="xs"
              @click="$emit('download-file', file.file_url)" />
            <UButton icon="i-heroicons-trash" color="error" variant="ghost" size="xs"
              @click="$emit('delete-file', file.id)" />
          </div>
        </div>
      </div>
    </div>

    <!-- FileUploader para nuevos archivos -->
    <FileUploader label="Subir Imágenes/Video" campo="inspeccion" campo-proveedor="inspeccion_proveedor"
      :proveedor-activo="{}" :archivos-por-tipo="{}" :archivos-seleccionados="{ inspeccion: selectedFiles }"
      :edit="true" :multiple="true" accept-types=".jpeg, .jpg, .png, .mp4" accept-types-text="Formatos: JPEG, PNG, MP4"
      @files-selected="handleFilesSelected" @download-file="$emit('download-file', $event)"
      @delete-file="$emit('delete-file', $event)" />
  </UCard>
</template>

<script setup lang="ts">
import type { FileItem } from '~/types/commons/file'
import ModalPreview from './commons/ModalPreview.vue'
interface Props {
  files: FileItem[]
  selectedFiles: File[]
}

interface Emits {
  (e: 'files-selected', files: File[]): void
  (e: 'download-file', url: string | null): void
  (e: 'delete-file', id: number): void
  (e: 'save'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const showModal = ref(false)
const selectedFile = ref<FileItem | null>(null)
const handleFilesSelected = (files: File[]) => {
  emit('files-selected', files)
}

const getFileIcon = (nombre: string) => {
  if (!nombre) return 'i-heroicons-document'

  const extension = nombre.split('.').pop()?.toLowerCase()
  const iconMap: Record<string, string> = {
    'jpg': 'i-heroicons-photo',
    'jpeg': 'i-heroicons-photo',
    'png': 'i-heroicons-photo',
    'mp4': 'i-heroicons-video-camera',
    'avi': 'i-heroicons-video-camera',
    'mov': 'i-heroicons-video-camera'
  }
  return iconMap[extension || ''] || 'i-heroicons-document'
}
const openFileModal = (file: FileItem) => {
  selectedFile.value = file
  showModal.value = true
}
</script>

<style scoped>
.file-item {
  @apply transition-all duration-200;
}

.file-item:hover {
  @apply transform scale-[1.02];
}
</style>
