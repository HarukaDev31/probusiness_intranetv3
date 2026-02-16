<template>
  <UModal :open="open" class="w-full max-w-md" :close="{ onClick: handleClose }" @update:open="(v: boolean) => { if (!v) handleClose() }">
    <template #header>
      <div class="flex items-center gap-2">
        <div class="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
          <UIcon name="i-heroicons-building-office-2" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Nueva entidad</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">Crear una entidad para el catálogo</p>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <UFormField label="Nombre" required :error="error">
          <UInput
            ref="inputRef"
            v-model="nombre"
            placeholder="Nombre de la entidad"
            size="lg"
            class="w-full"
            @keyup.enter="handleCreate"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Cancelar" variant="ghost" :disabled="loading" @click="handleClose" />
        <UButton
          label="Guardar"
          color="primary"
          :loading="loading"
          :disabled="!nombre.trim()"
          @click="handleCreate"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

interface Props {
  open: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'create', name: string): void
}>()

const nombre = ref('')
const error = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    nombre.value = ''
    error.value = ''
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

function handleCreate() {
  const name = nombre.value.trim()
  if (!name) {
    error.value = 'El nombre es requerido'
    return
  }
  error.value = ''
  emit('create', name)
}
</script>
