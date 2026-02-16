<template>
  <UModal :open="open" class="w-full max-w-md" :close="{ onClick: handleClose }" @update:open="(v: boolean) => { if (!v) handleClose() }">
    <template #header>
      <div class="flex items-center gap-2">
        <div class="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
          <UIcon name="i-heroicons-folder-plus" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Nueva categoría</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">Escribe el nombre de la carpeta (categoría)</p>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <UFormField label="Nombre de la categoría" required :error="error">
          <UInput
            ref="inputRef"
            v-model="nombreCategoria"
            placeholder="Ej: Anexos, Contratos, Certificados..."
            size="lg"
            class="w-full"
            @keydown.enter="handleSave"
          />
        </UFormField>
        <UFormField label="Archivo" required :error="uploadError">
          <FileUploader
            ref="fileUploaderRef"
            :multiple="false"
            :show-remove-button="true"
            custom-message="Selecciona o arrastra el archivo para la categoría"
            @error="(msg) => (uploadError = msg)"
            @file-added="hasFile = true"
            @file-removed="updateHasFile"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Cancelar" variant="ghost" @click="handleClose" />
        <UButton
          label="Crear categoría"
          color="primary"
          :disabled="!nombreCategoria.trim() || !hasFile"
          @click="handleSave"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import FileUploader from '~/components/commons/FileUploader.vue'

interface Props {
  open: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'create', nombreCategoria: string, archivo: File): void
}>()

const nombreCategoria = ref('')
const error = ref('')
const uploadError = ref('')
const hasFile = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const fileUploaderRef = ref<InstanceType<typeof FileUploader> | null>(null)

function updateHasFile() {
  nextTick(() => {
    const files = fileUploaderRef.value?.getFiles() ?? []
    hasFile.value = files.length > 0
  })
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    nombreCategoria.value = ''
    error.value = ''
    uploadError.value = ''
    hasFile.value = false
    fileUploaderRef.value?.clearSelectedFiles()
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

function handleClose() {
  emit('close')
}

function handleSave() {
  const nombre = nombreCategoria.value.trim()
  if (!nombre) {
    error.value = 'Escribe el nombre de la categoría'
    return
  }
  const files = fileUploaderRef.value?.getFiles() ?? []
  if (files.length === 0) {
    uploadError.value = 'Selecciona un archivo'
    return
  }
  error.value = ''
  uploadError.value = ''
  emit('create', nombre, files[0])
}
</script>
