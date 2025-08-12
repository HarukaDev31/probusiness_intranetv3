<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          <UIcon name="i-heroicons-folder-open" class="mr-2" />
          Documentación
        </h2>
      </div>
    </template>

    <!-- Archivos existentes -->
    <div v-if="files.length > 0" class="mb-4 space-y-2">
      <div v-for="file in files" :key="file.id" class="file-item">
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="flex items-center space-x-3">
            <ModalPreview :file="file" :is-open="showModal">
              <template #trigger>
                <UIcon :name="getFileIcon(file.file_name)" class="text-2xl text-gray-500"
                  @click="openFileModal(file)" />
              </template>
            </ModalPreview>
            <!-- <UIcon :name="getFileIcon(file.file_name)" class="text-2xl text-gray-500" /> -->
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
    <FileUploader label="Subir Documentos" campo="documentacion" campo-proveedor="documentacion_proveedor"
      :proveedor-activo="{}" :archivos-por-tipo="{}" :archivos-seleccionados="{ documentacion: selectedFiles }"
      :edit="true" :multiple="true" accept-types=".pdf, .docx, .xlsx, .xls, .doc, .xlsm"
      accept-types-text="Formatos: PDF, DOCX, XLSX, XLS, DOC" @files-selected="handleFilesSelected"
      @download-file="$emit('download-file', $event)" @delete-file="$emit('delete-file', $event)" />
  </UCard>
</template>

<script setup lang="ts">
import type { FileItem } from '~/types/commons/file'
import ModalPreview from './commons/ModalPreview.vue'
interface Emits {
  (e: 'files-selected', files: File[]): void
  (e: 'download-file', url: string | null): void
  (e: 'delete-file', id: number): void
}

const props = defineProps<{
  files: FileItem[]
  selectedFiles: File[]
}>()
const showModal = ref(false)
const selectedFile = ref<FileItem | null>(null)
const emit = defineEmits<Emits>()

const handleFilesSelected = (files: File[]) => {
  emit('files-selected', files)
}

const getFileIcon = (nombre: string) => {
  if (!nombre) return 'i-heroicons-document'

  const extension = nombre.split('.').pop()?.toLowerCase()
  const iconMap: Record<string, string> = {
    'pdf': 'i-heroicons-document-text',
    'docx': 'i-heroicons-document-text',
    'doc': 'i-heroicons-document-text',
    'xlsx': 'i-heroicons-table-cells',
    'xls': 'i-heroicons-table-cells',
    'xlsm': 'i-heroicons-table-cells'
  }
  return iconMap[extension || ''] || 'i-heroicons-document'
}

const openFileModal = (file: FileItem) => {
  showModal.value = true
  selectedFile.value = file
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
