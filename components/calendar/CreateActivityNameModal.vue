<template>
  <UModal :open="open" @close="handleClose" class="w-full max-w-md">
    <template #header>
      <div class="flex items-center gap-2">
        <div class="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
          <UIcon name="i-heroicons-plus" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Nueva Actividad</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">Crear una actividad para el catálogo</p>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <UFormField label="Nombre de la actividad" required :error="error">
          <UInput
            ref="inputRef"
            v-model="activityName"
            placeholder="Ej: Revisión de documentos, Coordinación de envío..."
            size="lg"
            class="w-full"
            @keyup.enter="handleCreate"
          />
        </UFormField>

       
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          label="Cancelar"
          variant="ghost"
          :disabled="loading"
          @click="handleClose"
        />
        <UButton
          label="Crear actividad"
          color="primary"
          :loading="loading"
          :disabled="!activityName.trim()"
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
  loading: false
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'create', name: string): void
}>()

const activityName = ref('')
const error = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

// Focus en el input cuando se abre el modal
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    activityName.value = ''
    error.value = ''
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

const handleClose = () => {
  if (!props.loading) {
    emit('close')
  }
}

const handleCreate = () => {
  const name = activityName.value.trim()
  
  if (!name) {
    error.value = 'El nombre es requerido'
    return
  }

  if (name.length < 3) {
    error.value = 'El nombre debe tener al menos 3 caracteres'
    return
  }

  error.value = ''
  emit('create', name)
}
</script>
