<template>
  <UModal v-model:open="open" title="Descartar cotización">
    <template #body>
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Selecciona la razón de descarte o crea una nueva.
        </p>

        <div class="flex items-center gap-2">
          <USelect
            :model-value="selectedReasonId"
            :items="reasonItems"
            :loading="loadingReasons"
            :disabled="loadingReasons"
            placeholder="Seleccionar razón"
            class="w-full"
            @update:model-value="(value: number | string) => { selectedReasonId = Number(value) || 0 }"
          />
          <UButton
            icon="i-heroicons-plus"
            color="primary"
            variant="soft"
            title="Crear razón de descarte"
            @click="showCreateReasonModal = true"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="open = false" />
        <UButton
          label="Descartar"
          color="error"
          :loading="saving"
          :disabled="!selectedReasonId || saving"
          @click="handleConfirm"
        />
      </div>
    </template>
  </UModal>

  <UModal v-model:open="showCreateReasonModal" title="Crear razón de descarte">
    <template #body>
      <UInput v-model="newReasonName" placeholder="Nombre de la razón" class="w-full" @keyup.enter="handleCreateReason" />
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="showCreateReasonModal = false" />
        <UButton label="Guardar" color="primary" :disabled="!newReasonName.trim()" @click="handleCreateReason" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useModal } from '~/composables/commons/useModal'

interface RazonOption {
  id: number
  name: string
}

interface RazonDescarteModalHandlers {
  fetchReasons: () => Promise<RazonOption[]>
  createReason: (name: string) => Promise<RazonOption | void>
  confirm: (reasonId: number) => Promise<void>
}

const props = defineProps<{
  modelValue: boolean
  handlers: RazonDescarteModalHandlers
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
const saving = ref(false)
const selectedReasonId = ref(0)
const reasons = ref<RazonOption[]>([])
const newReasonName = ref('')
const showCreateReasonModal = ref(false)

const reasonItems = computed(() => reasons.value.map((item) => ({ label: item.name, value: item.id })))

const loadReasons = async () => {
  loadingReasons.value = true
  try {
    reasons.value = await props.handlers.fetchReasons()
  } catch (error) {
    showError('Error al cargar razones', String(error))
  } finally {
    loadingReasons.value = false
  }
}

watch(open, (value) => {
  if (value) {
    selectedReasonId.value = 0
    newReasonName.value = ''
    showCreateReasonModal.value = false
    loadReasons()
  }
})

const handleCreateReason = async () => {
  const name = newReasonName.value.trim()
  if (!name) return
  try {
    const created = await props.handlers.createReason(name)
    newReasonName.value = ''
    showCreateReasonModal.value = false
    await loadReasons()
    if (created && created.id) {
      selectedReasonId.value = created.id
    }
  } catch (error) {
    showError('Error al crear razón', String(error))
  }
}

const handleConfirm = async () => {
  if (!selectedReasonId.value) {
    showError('Razón requerida', 'Debes seleccionar una razón para descartar la cotización.')
    return
  }
  saving.value = true
  try {
    await props.handlers.confirm(selectedReasonId.value)
    open.value = false
  } catch (error) {
    showError('Error al descartar', String(error))
  } finally {
    saving.value = false
  }
}
</script>
