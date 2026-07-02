<template>
  <UModal v-model:open="open">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-pencil-square" class="w-5 h-5 text-primary-500" />
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Editar actividad</h3>
            </div>
            <UButton icon="i-heroicons-x-mark" variant="ghost" size="xs" @click="open = false" />
          </div>
        </template>

        <div class="space-y-4">
          <UFormField label="Nombre de la actividad">
            <UInput
              v-model="nombre"
              placeholder="Ej. Revisión documentos"
              autofocus
              @keydown.enter="handleSave"
            />
          </UFormField>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton label="Cancelar" variant="ghost" color="neutral" @click="open = false" />
            <UButton
              label="Guardar"
              color="primary"
              :loading="loading"
              :disabled="!nombre.trim()"
              @click="handleSave"
            />
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  open: boolean
  activityId: number | null
  activityName: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'save', payload: { id: number; name: string }): void
}>()

const open = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

const nombre = ref(props.activityName)

watch(() => props.activityName, (val) => {
  nombre.value = val
})

watch(() => props.open, (val) => {
  if (val) nombre.value = props.activityName
})

function handleSave() {
  if (!nombre.value.trim() || !props.activityId) return
  emit('save', { id: props.activityId, name: nombre.value.trim() })
}
</script>
