<template>
  <UModal v-model:open="open">
    <template #content>
      <UCard>
        <template #header>
          <h2 class="text-base font-semibold">Editar imagen</h2>
        </template>
        <div class="space-y-3" @paste="onClipboardPaste">
          <div
            class="flex h-40 items-center justify-center overflow-hidden rounded-lg bg-gray-50 outline-none dark:bg-gray-900"
            tabindex="0"
          >
            <img
              v-if="previewSrc"
              :src="previewSrc"
              :alt="nombre || 'Vista previa'"
              class="h-full w-full object-contain"
            >
            <span v-else class="text-xs text-gray-400">Sin archivo</span>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium">Nombre</label>
            <UInput
              v-model="nombre"
              class="w-full"
              placeholder="Ej. Noticias — tarjetas y detalle"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium">Reemplazar archivo</label>
            <p class="mb-1 text-xs text-gray-500">Pega con Ctrl+V</p>
            <FileUploader
              ref="uploaderRef"
              :key="uploaderKey"
              :multiple="false"
              :accepted-types="['.jpg', '.jpeg', '.png', '.gif', '.webp']"
              :max-file-size="10 * 1024 * 1024"
              :model-files="pendingFile ? [pendingFile] : []"
              :initial-files="[]"
              :show-save-button="false"
              :show-remove-button="true"
              custom-message="Arrastra una imagen o haz clic en «Subir»"
              @file-added="onFileAdded"
              @file-removed="onFileRemoved"
              @error="onFileError"
            />
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" color="neutral" @click="closeModal">Cancelar</UButton>
            <UButton color="primary" icon="i-heroicons-check" :loading="saving" @click="emitSave">
              Guardar
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import FileUploader from '~/components/commons/FileUploader.vue'
import type { ManualCapturaCatalogItem } from '~/types/manualUsuario'
import { esTargetEdicionTexto, imagenDesdePortapapeles } from '~/utils/clipboardImage'

const props = defineProps<{
  item: ManualCapturaCatalogItem | null
  saving?: boolean
}>()

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  save: [payload: { nombre: string; file: File | null }]
}>()

const toast = useToast()
const nombre = ref('')
const pendingFile = ref<File | null>(null)
const previewOverride = ref<string | null>(null)
const uploaderKey = ref(0)
const uploaderRef = ref<{ addFiles: (files: File[]) => void } | null>(null)

const previewSrc = computed(() => previewOverride.value || props.item?.url || '')

const resetFromItem = () => {
  nombre.value = String(props.item?.nombre || '').trim()
  pendingFile.value = null
  if (previewOverride.value) {
    URL.revokeObjectURL(previewOverride.value)
    previewOverride.value = null
  }
  uploaderKey.value += 1
}

const onFileAdded = (file: File) => {
  pendingFile.value = file
  if (previewOverride.value) URL.revokeObjectURL(previewOverride.value)
  previewOverride.value = URL.createObjectURL(file)
}

const applyPastedImage = (file: File) => {
  if (uploaderRef.value?.addFiles) {
    uploaderRef.value.addFiles([file])
    return
  }
  onFileAdded(file)
}

const onClipboardPaste = (e: ClipboardEvent) => {
  if (!open.value || e.defaultPrevented) return
  if (esTargetEdicionTexto(e.target)) return
  const file = imagenDesdePortapapeles(e)
  if (!file) return
  e.preventDefault()
  e.stopPropagation()
  applyPastedImage(file)
}

watch(open, (isOpen) => {
  if (isOpen) {
    resetFromItem()
    window.addEventListener('paste', onClipboardPaste)
    return
  }
  window.removeEventListener('paste', onClipboardPaste)
})

watch(() => props.item?.id, () => {
  if (open.value) resetFromItem()
})

const onFileRemoved = () => {
  pendingFile.value = null
  if (previewOverride.value) {
    URL.revokeObjectURL(previewOverride.value)
    previewOverride.value = null
  }
}

const onFileError = (message: string) => {
  toast.add({ title: 'Archivo no válido', description: message, color: 'error' })
}

const emitSave = () => {
  const nextNombre = nombre.value.trim()
  if (!nextNombre) {
    toast.add({ title: 'Escribe un nombre visible', color: 'warning' })
    return
  }
  emit('save', { nombre: nextNombre, file: pendingFile.value })
}

const closeModal = () => {
  open.value = false
}

onBeforeUnmount(() => {
  window.removeEventListener('paste', onClipboardPaste)
  if (previewOverride.value) URL.revokeObjectURL(previewOverride.value)
})
</script>
