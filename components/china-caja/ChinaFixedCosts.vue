<template>
  <UCard>
    <h2 class="text-lg font-bold text-highlighted">Costos fijos mensuales</h2>
    <p class="mb-2 text-sm text-muted">Se descuentan solos el último día del mes · {{ rmb(total) }}</p>
    <div v-for="cost in costs" :key="cost.id" class="flex items-center gap-3 border-t border-default py-2 text-sm">
      <USwitch :model-value="cost.active" @update:model-value="(on: boolean) => emit('toggle', cost.id, on)" />
      <span class="flex-1" :class="cost.active ? '' : 'text-muted line-through'">{{ cost.name }}</span>
      <strong>{{ rmb(cost.amount) }}</strong>
      <UButton size="xs" color="error" variant="ghost" icon="i-heroicons-x-mark" aria-label="Eliminar" @click="remove(cost)" />
    </div>
    <form class="mt-3 flex gap-2" @submit.prevent="add">
      <UInput v-model="name" placeholder="Nombre" class="flex-1" />
      <UInputNumber v-model="amount" :min="0" :step="0.01" :ui="AMOUNT_UI" placeholder="RMB" class="w-28" />
      <UButton type="submit" :disabled="!name.trim() || !amount">Agregar</UButton>
    </form>
  </UCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useModal } from '~/composables/commons/useModal'
import { AMOUNT_UI } from '~/constants/chinaCaja'
import type { ChinaFixedCost } from '~/types/china-caja'
import { rmb } from '~/utils/yuanFormat'

const props = defineProps<{ costs: ChinaFixedCost[] }>()
const emit = defineEmits<{ add: [body: { name: string; amount: number }]; toggle: [id: number, active: boolean]; remove: [id: number] }>()
const { showConfirmation } = useModal()
const name = ref('')
const amount = ref<number | null>(null)
const total = computed(() => props.costs.filter((cost) => cost.active).reduce((sum, cost) => sum + cost.amount, 0))

function add() {
  if (!name.value.trim() || !amount.value) return
  emit('add', { name: name.value.trim(), amount: amount.value })
  name.value = ''
  amount.value = null
}

function remove(cost: ChinaFixedCost) {
  showConfirmation('¿Eliminar el costo fijo?', `${cost.name}: ya no se descontará desde este mes.`, () => emit('remove', cost.id))
}
</script>
