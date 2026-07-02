<template>
  <UModal :open="open" class="w-full max-w-lg" :close="{ onClick: handleClose }" @update:open="(v: boolean) => { if (!v) handleClose() }">
    <template #header>
      <div class="flex items-center gap-2">
        <div class="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
          <UIcon name="i-heroicons-document-plus" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Nuevo tipo de documento</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">Crear una nueva categoría de documento</p>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <UFormField label="Sección" required :error="errors.categoria">
          <USelectMenu
            v-model="form.categoria"
            :items="categoriaOptions"
            placeholder="Selecciona sección"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Categoría del documento" required :error="errors.nombre_documento">
          <UInput
            ref="inputRef"
            v-model="form.nombre_documento"
            placeholder="Ej: Factura Comercial, Packing List..."
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Archivos" :error="errors.archivos">
          <FileUploader
            :multiple="true"
            :show-remove-button="true"
            :model-files="archivos"
            @file-added="(file: File) => { archivos.push(file) }"
            @file-removed="(index: number) => { archivos.splice(index, 1) }"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Cancelar" variant="ghost" :disabled="loading" @click="handleClose" />
        <UButton
          label="Guardar documentos"
          color="primary"
          :loading="loading"
          :disabled="!canSave"
          @click="handleSave"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import FileUploader from '~/components/commons/FileUploader.vue'
import type { DocumentoCategoria } from '~/types/basedatos/tramiteAduana'
import { DOCUMENTO_CATEGORIAS } from '~/types/basedatos/tramiteAduana'

interface Props {
  open: boolean
  loading?: boolean
  defaultCategoria?: DocumentoCategoria | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  defaultCategoria: null,
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: { categoria: DocumentoCategoria; nombre_documento: string; archivos: File[] }): void
}>()

const form = ref<{ categoria: DocumentoCategoria | null; nombre_documento: string }>({
  categoria: null,
  nombre_documento: '',
})
const archivos = ref<File[]>([])
const errors = ref<Record<string, string>>({})
const inputRef = ref<HTMLInputElement | null>(null)

const categoriaOptions = DOCUMENTO_CATEGORIAS.map(c => ({ value: c.value, label: c.label }))

const canSave = computed(() => {
  return form.value.categoria && form.value.nombre_documento.trim() && archivos.value.length > 0
})

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    form.value = {
      categoria: props.defaultCategoria || null,
      nombre_documento: '',
    }
    archivos.value = []
    errors.value = {}
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

function handleClose() {
  if (!props.loading) {
    emit('close')
  }
}

function handleSave() {
  errors.value = {}
  if (!form.value.categoria) {
    errors.value.categoria = 'La sección es requerida'
    return
  }
  if (!form.value.nombre_documento.trim()) {
    errors.value.nombre_documento = 'La categoría es requerida'
    return
  }
  if (archivos.value.length === 0) {
    errors.value.archivos = 'Selecciona al menos un archivo'
    return
  }

  emit('save', {
    categoria: form.value.categoria,
    nombre_documento: form.value.nombre_documento.trim(),
    archivos: archivos.value,
  })
}
</script>
