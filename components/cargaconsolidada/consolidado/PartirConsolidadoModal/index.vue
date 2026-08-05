<template>
  <UModal>
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h3>Partir consolidado</h3>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          El original queda como A. Se crean copias vacías (sin cotizaciones ni proveedores).
        </p>
        <UFormField label="Cantidad de subconsolidados" required>
          <USelect
            v-model="cantidad"
            :items="cantidadOptions"
            placeholder="Selecciona cantidad"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex justify-end gap-3">
        <UButton color="neutral" variant="outline" @click="close">
          Cancelar
        </UButton>
        <UButton color="primary" :disabled="!cantidad" @click="handleConfirm(close)">
          Partir
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  id: number
  onConfirm?: (payload: { id: number; cantidad: number }) => void | Promise<void>
}>()

const cantidad = ref<number>(2)
const cantidadOptions = Array.from({ length: 9 }, (_, i) => {
  const value = i + 2
  return { label: String(value), value }
})

const handleConfirm = async (close: () => void) => {
  if (!cantidad.value || !props.onConfirm) return
  await props.onConfirm({ id: props.id, cantidad: Number(cantidad.value) })
  close()
}
</script>
