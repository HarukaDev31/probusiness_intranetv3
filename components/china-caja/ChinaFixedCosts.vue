<template>
  <section class="cc-card flex flex-col">
    <div class="flex flex-col gap-0.5 border-b border-(--cc-line) px-[18px] py-4">
      <span class="cc-title-row"><span class="cc-title">Costos fijos mensuales</span><ChinaInfo topic="fijos" /></span>
      <span class="text-[13px] text-(--cc-muted)">{{ costs.length }} {{ costs.length === 1 ? 'costo' : 'costos' }} · se descuentan el último día del mes · {{ money(total) }} al mes</span>
    </div>
    <div class="max-h-[232px] overflow-y-auto">
      <div v-for="cost in costs" :key="cost.id" class="flex items-center gap-2.5 border-b border-(--cc-line) px-[18px] py-2.5" :class="cost.active ? '' : 'opacity-50'">
        <button type="button" class="cc-switch" :class="{ on: cost.active }" :title="cost.active ? 'Pausar' : 'Activar'" role="switch" :aria-checked="cost.active" @click="emit('toggle', cost.id, !cost.active)"><span /></button>
        <span class="cc-grow cc-cut text-sm">{{ cost.name }}</span>
        <span class="text-sm font-semibold">{{ money(cost.amount) }}</span>
        <button type="button" class="cc-x" title="Eliminar" @click="remove(cost)">×</button>
      </div>
    </div>
    <form class="flex gap-1.5 px-[18px] py-3" @submit.prevent="add">
      <UInput v-model="name" variant="none" placeholder="Nuevo costo" class="min-w-0 flex-1" :ui="{ base: 'cc-input cc-input--small' }" />
      <UInputNumber v-model="amount" :min="0" :step="0.01" variant="none" placeholder="¥ monto" class="w-[90px]" :ui="{ ...AMOUNT_UI, base: 'cc-input cc-input--small' }" />
      <button type="submit" class="cc-btn !rounded-lg !px-3 !py-0 !text-[13px]">Agregar</button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ChinaInfo from '~/components/china-caja/ChinaInfo.vue'
import { useModal } from '~/composables/commons/useModal'
import { AMOUNT_UI } from '~/constants/chinaCaja'
import type { ChinaFixedCost } from '~/types/china-caja'

const props = defineProps<{ costs: ChinaFixedCost[]; money: (value: number) => string }>()
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
  showConfirmation(`¿Eliminar el costo fijo "${cost.name}"?`, 'Dejará de descontarse cada fin de mes.', () => emit('remove', cost.id))
}
</script>
