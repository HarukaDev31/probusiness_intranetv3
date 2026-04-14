<template>
  <UModal v-model:open="isOpen" class="sm:max-w-md" @update:open="onModalOpenChange">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Cobro de servicios
      </h3>
    </template>
    <template #body>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Cliente: <span class="font-medium text-gray-900 dark:text-white">{{ clienteNombre }}</span>
      </p>
      <p class="text-xs text-gray-500 mb-3">
        Marca los servicios que incluirás en el mensaje de cobro (WhatsApp).
      </p>
      <div class="flex flex-col gap-2 max-h-64 overflow-y-auto">
        <label
          v-for="s in servicios"
          :key="s.id"
          class="flex items-start gap-3 p-2 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          <UCheckbox
            :model-value="selectedIds.includes(s.id)"
            class="mt-0.5"
            @update:model-value="(v: boolean) => toggle(s.id, v)"
          />
          <div class="text-sm">
            <div class="font-medium">{{ labelTipo(s.tipo_servicio) }}</div>
            <div class="text-gray-600 dark:text-gray-400">{{ formatPen(s.importe) }}</div>
          </div>
        </label>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="outline" @click="close">Cancelar</UButton>
        <UButton
          color="primary"
          :disabled="selectedIds.length === 0 || sending"
          :loading="sending"
          @click="onConfirm"
        >
          Enviar cobro
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { UButton, UCheckbox } from '#components'

export type ServicioLine = { id: number; tipo_servicio: string; importe: number }

const props = defineProps<{
  modelValue?: boolean
  servicios: ServicioLine[]
  clienteNombre: string
  sending?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
  (e: 'confirm', servicioIds: number[]): void
}>()

const isOpen = computed({
  get: () => props.modelValue ?? false,
  set: (v: boolean) => emit('update:modelValue', v)
})

const selectedIds = ref<number[]>([])

watch(
  () => [props.modelValue, props.servicios] as const,
  ([open, list]) => {
    if (open && list?.length) {
      selectedIds.value = list.map(s => s.id)
    }
  },
  { immediate: true }
)

function formatPen(n: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(n) || 0)
}

function labelTipo(t: string) {
  if (t === 'MONTACARGA') return 'Montacarga'
  if (t === 'DELIVERY') return 'Delivery'
  return t || 'Servicio'
}

function toggle(id: number, checked: boolean) {
  if (checked) {
    if (!selectedIds.value.includes(id)) selectedIds.value = [...selectedIds.value, id]
  } else {
    selectedIds.value = selectedIds.value.filter(x => x !== id)
  }
}

function close() {
  emit('close')
  isOpen.value = false
}

function onModalOpenChange(open: boolean) {
  if (!open) emit('close')
}

function onConfirm() {
  emit('confirm', [...selectedIds.value])
}
</script>
