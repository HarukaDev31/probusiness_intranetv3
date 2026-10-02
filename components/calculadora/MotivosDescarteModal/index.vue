<template>
  <UModal v-model:open="open" title="Motivos de descarte" :description="description">
    <template #body>
      <div class="space-y-4">
        <div class="flex gap-2">
          <UInput
            v-model="newName"
            placeholder="Nuevo motivo, ej. Demora en respuesta"
            class="flex-1"
            :disabled="saving"
            @keyup.enter="handleCreate"
          />
          <UButton label="Agregar" color="primary" :loading="saving" :disabled="!newName.trim() || saving" @click="handleCreate" />
        </div>

        <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div v-if="loading" class="p-4 text-sm text-gray-500">Cargando motivos...</div>
          <div v-else-if="!reasons.length" class="p-4 text-sm text-gray-500">No hay motivos registrados.</div>
          <div
            v-for="reason in reasons"
            v-else
            :key="reason.id"
            class="flex items-center justify-between gap-3 px-4 py-2.5 border-b last:border-b-0 border-gray-100 dark:border-gray-800"
          >
            <span class="text-sm text-gray-900 dark:text-white">{{ reason.name }}</span>
            <div class="flex items-center gap-3">
              <span class="text-xs text-gray-500">{{ reason.uses ?? 0 }} en uso</span>
              <UButton
                icon="i-heroicons-trash"
                color="error"
                variant="ghost"
                size="sm"
                title="Eliminar motivo"
                @click="handleDelete(reason)"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useModal } from '~/composables/commons/useModal'

interface Motivo {
  id: number
  name: string
  uses?: number
}

interface MotivosDescarteHandlers {
  fetchReasons: () => Promise<Motivo[]>
  createReason: (name: string) => Promise<unknown>
  deleteReason: (id: number) => Promise<void>
}

const props = defineProps<{
  modelValue: boolean
  handlers: MotivosDescarteHandlers
  /** Si viene, el motivo creado se asigna a esta cotización (emit `assign`) y se cierra el modal */
  targetId?: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'assign', reasonId: number): void
}>()

const description = computed(() => props.targetId
  ? `Crea el motivo y se asignará a la cotización #${props.targetId}`
  : 'Crea, revisa o elimina los motivos que usa el equipo de ventas')

const { showError, showConfirmation } = useModal()

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const reasons = ref<Motivo[]>([])
const loading = ref(false)
const saving = ref(false)
const newName = ref('')

const loadReasons = async () => {
  loading.value = true
  try {
    reasons.value = await props.handlers.fetchReasons()
  } catch (error) {
    showError('Error al cargar motivos', String(error))
  } finally {
    loading.value = false
  }
}

watch(open, (value) => {
  if (value) {
    newName.value = ''
    loadReasons()
  }
})

const handleCreate = async () => {
  const name = newName.value.trim()
  if (!name || saving.value) return
  saving.value = true
  try {
    const created = await props.handlers.createReason(name) as Motivo | undefined
    newName.value = ''
    if (props.targetId && created?.id) {
      const targetReason = created.id
      open.value = false
      emit('assign', targetReason)
      return
    }
    await loadReasons()
  } catch (error) {
    showError('Error al crear motivo', String(error))
  } finally {
    saving.value = false
  }
}

const handleDelete = (reason: Motivo) => {
  showConfirmation(
    'Eliminar motivo',
    `¿Deseas eliminar "${reason.name}"? Las cotizaciones que ya lo usan lo conservan, pero dejará de aparecer en la lista.`,
    async () => {
      try {
        await props.handlers.deleteReason(reason.id)
        await loadReasons()
      } catch (error) {
        showError('Error al eliminar motivo', String(error))
      }
    }
  )
}
</script>
