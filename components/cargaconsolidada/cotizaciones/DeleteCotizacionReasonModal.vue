<template>
  <UModal v-model:open="open" title="Eliminar cotización">
    <template #body>
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Selecciona o crea el motivo de eliminación.
        </p>

        <div class="flex items-center gap-2">
          <USelect
            :model-value="selectedReasonId"
            :items="reasonItems"
            :loading="loadingReasons"
            :disabled="loadingReasons"
            placeholder="Seleccionar motivo"
            class="w-full"
            @update:model-value="(value: number | string) => { selectedReasonId = Number(value) || 0 }"
          />
          <UButton
            icon="i-heroicons-plus"
            color="primary"
            variant="soft"
            title="Crear motivo"
            @click="showCreateReasonModal = true"
          />
          <UButton
            icon="i-heroicons-pencil-square"
            color="warning"
            variant="soft"
            title="Editar motivo"
            :disabled="!selectedReasonId"
            @click="openEditReasonModal"
          />
          <UButton
            icon="i-heroicons-trash"
            color="error"
            variant="soft"
            title="Eliminar motivo"
            :disabled="!selectedReasonId"
            @click="showConfirmDeleteReasonModal = true"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="closeMainModal" />
        <UButton label="Eliminar" color="error" :disabled="!selectedReasonId" @click="showConfirmDeleteCotizacionModal = true" />
      </div>
    </template>
  </UModal>

  <UModal v-model:open="showCreateReasonModal" title="Crear motivo de eliminación">
    <template #body>
      <div class="space-y-3">
        <UInput v-model="newReasonName" placeholder="Nombre del motivo" class="w-full" />
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="showCreateReasonModal = false" />
        <UButton label="Guardar" color="primary" :disabled="!newReasonName.trim()" @click="handleCreateReason" />
      </div>
    </template>
  </UModal>

  <UModal v-model:open="showEditReasonModal" title="Editar motivo de eliminación">
    <template #body>
      <div class="space-y-3">
        <UInput v-model="editingReasonName" placeholder="Nombre del motivo" class="w-full" />
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="showEditReasonModal = false" />
        <UButton label="Guardar cambios" color="warning" :disabled="!editingReasonName.trim()" @click="handleUpdateReason" />
      </div>
    </template>
  </UModal>

  <UModal v-model:open="showConfirmDeleteReasonModal" title="Eliminar motivo">
    <template #body>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        ¿Deseas eliminar el motivo seleccionado? Esta acción no se puede deshacer.
      </p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="showConfirmDeleteReasonModal = false" />
        <UButton label="Eliminar" color="error" @click="handleDeleteReason" />
      </div>
    </template>
  </UModal>

  <UModal v-model:open="showConfirmDeleteCotizacionModal" title="Confirmar eliminación">
    <template #body>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        ¿Estás seguro de eliminar esta cotización? Esta acción no se puede deshacer.
      </p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="showConfirmDeleteCotizacionModal = false" />
        <UButton label="Eliminar" color="error" @click="handleConfirmDeleteCotizacion" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useModal } from '~/composables/commons/useModal'
import type { DeleteCotizacionReasonModalHandlers, DeleteReasonOption } from './DeleteCotizacionReasonModal.types'

const props = defineProps<{
  modelValue: boolean
  handlers: DeleteCotizacionReasonModalHandlers
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { showError } = useModal()

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const loadingReasons = ref(false)
const selectedReasonId = ref(0)
const reasons = ref<DeleteReasonOption[]>([])

const newReasonName = ref('')
const editingReasonName = ref('')

const showCreateReasonModal = ref(false)
const showEditReasonModal = ref(false)
const showConfirmDeleteReasonModal = ref(false)
const showConfirmDeleteCotizacionModal = ref(false)

const reasonItems = computed(() => reasons.value.map((item) => ({ label: item.name, value: item.id })))

const loadReasons = async () => {
  loadingReasons.value = true
  try {
    reasons.value = await props.handlers.fetchReasons()
  } catch (error) {
    showError('Error al cargar motivos', String(error))
  } finally {
    loadingReasons.value = false
  }
}

watch(open, (value) => {
  if (value) {
    selectedReasonId.value = 0
    newReasonName.value = ''
    editingReasonName.value = ''
    showCreateReasonModal.value = false
    showEditReasonModal.value = false
    showConfirmDeleteReasonModal.value = false
    showConfirmDeleteCotizacionModal.value = false
    loadReasons()
  }
})

const closeMainModal = () => {
  open.value = false
}

const openEditReasonModal = () => {
  if (!selectedReasonId.value) return
  const selected = reasons.value.find((item) => item.id === selectedReasonId.value)
  if (!selected) return
  editingReasonName.value = selected.name
  showEditReasonModal.value = true
}

const handleCreateReason = async () => {
  const name = newReasonName.value.trim()
  if (!name) return
  try {
    await props.handlers.createReason(name)
    newReasonName.value = ''
    showCreateReasonModal.value = false
    await loadReasons()
  } catch (error) {
    showError('Error al crear motivo', String(error))
  }
}

const handleUpdateReason = async () => {
  if (!selectedReasonId.value || !editingReasonName.value.trim()) return
  try {
    await props.handlers.updateReason(selectedReasonId.value, editingReasonName.value.trim())
    showEditReasonModal.value = false
    await loadReasons()
  } catch (error) {
    showError('Error al actualizar motivo', String(error))
  }
}

const handleDeleteReason = async () => {
  if (!selectedReasonId.value) return
  try {
    await props.handlers.deleteReason(selectedReasonId.value)
    selectedReasonId.value = 0
    showConfirmDeleteReasonModal.value = false
    await loadReasons()
  } catch (error) {
    showError('Error al eliminar motivo', String(error))
  }
}

const handleConfirmDeleteCotizacion = async () => {
  if (!selectedReasonId.value) {
    showError('Motivo requerido', 'Debes seleccionar un motivo para eliminar la cotización.')
    return
  }
  try {
    await props.handlers.confirmDeleteCotizacion(selectedReasonId.value)
    showConfirmDeleteCotizacionModal.value = false
    open.value = false
  } catch (error) {
    showError('Error al eliminar cotización', String(error))
  }
}
</script>

