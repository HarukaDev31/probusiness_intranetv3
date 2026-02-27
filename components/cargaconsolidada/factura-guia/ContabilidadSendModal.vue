<template>
  <UModal :modelValue="true" @close="handleClose" class="sm:max-w-md">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="iconamoon:menu-burger-horizontal" class="w-5 h-5 text-primary-500" />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Acciones — WhatsApp</h3>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <p class="text-sm text-gray-500">
          Selecciona la acción a realizar para:
          <span class="font-semibold text-gray-800 dark:text-white">{{ props.clienteNombre }}</span>
        </p>

        <USelect
          v-model="selectedAction"
          :items="actionOptions"
          placeholder="Selecciona una acción"
          size="lg"
          class="w-full"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <UButton color="error" variant="outline" @click="handleClose">Cerrar</UButton>
        <UButton
          color="primary"
          variant="solid"
          icon="i-heroicons-paper-airplane"
          :loading="loading"
          :disabled="!selectedAction || loading"
          @click="handleSend"
        >
          Enviar
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { USelect, UButton, UIcon } from '#components'

export type ContabilidadAction = 'comprobantes' | 'guias' | 'detracciones' | 'formulario'

const props = defineProps<{
  idCotizacion: number
  clienteNombre: string
  onClose?: () => void
  onSend?: (action: ContabilidadAction) => void
}>()

const loading = ref(false)
const selectedAction = ref<ContabilidadAction | null>(null)

const actionOptions: { label: string; value: ContabilidadAction }[] = [
  { label: 'Enviar comprobantes', value: 'comprobantes' },
  { label: 'Enviar guías', value: 'guias' },
  { label: 'Enviar detracciones', value: 'detracciones' },
  { label: 'Enviar formulario', value: 'formulario' },
]

const handleClose = () => props.onClose?.()

const handleSend = () => {
  if (!selectedAction.value) return
  loading.value = true
  props.onSend?.(selectedAction.value)
  setTimeout(() => {
    loading.value = false
    selectedAction.value = null
  }, 100)
}
</script>
