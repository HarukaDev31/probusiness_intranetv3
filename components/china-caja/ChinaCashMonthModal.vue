<template>
  <ChinaWindow :open="open" :title="`Cerrar ${chinaMonthName(data.month).toLowerCase()} ${data.month.slice(0, 4)}`" subtitle="Compara con el estado de cuenta del banco antes de cerrar." @close="emit('close')">
    <div v-for="row in rows" :key="row.label" class="cc-line"><span class="cc-t-muted">{{ row.label }}</span><span class="font-semibold" :class="row.tone">{{ row.value }}</span></div>
    <label class="cc-field mt-1.5">Saldo según estado de cuenta (¥) *
      <UInputNumber v-model="balance" :step="0.01" variant="none" placeholder="Escribe el saldo del banco" :ui="{ ...AMOUNT_UI, base: 'cc-input !px-3.5 !py-[11px] !text-base font-semibold' }" />
    </label>
    <span class="text-[13px] text-(--cc-body)">{{ balance === null ? 'El monto es obligatorio para cerrar el mes.' : `${nextMonth} iniciará con ${signedRmb(balance)}.` }}</span>
    <template #footer>
      <button type="button" class="cc-btn cc-btn--plain" @click="emit('close')">Cancelar</button>
      <button type="button" class="cc-btn" :disabled="balance === null" @click="balance !== null && emit('save', balance)">Cerrar mes</button>
    </template>
  </ChinaWindow>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ChinaWindow from '~/components/china-caja/ChinaWindow.vue'
import { AMOUNT_UI } from '~/constants/chinaCaja'
import type { ChinaCashMonth } from '~/types/china-caja'
import { chinaMonthName, nextChinaMonth, signedRmb } from '~/utils/chinaCaja'

const props = defineProps<{ open: boolean; data: ChinaCashMonth }>()
const emit = defineEmits<{ close: []; save: [balance: number] }>()
const balance = ref<number | null>(null)
const nextMonth = computed(() => chinaMonthName(nextChinaMonth(props.data.month)))
const rows = computed(() => {
  const opening = props.data.opening_balance ?? 0
  const final = opening + props.data.totals.profit
  return [
    { label: 'Saldo inicial', value: signedRmb(opening), tone: '' },
    { label: 'Ingresos', value: `+${signedRmb(props.data.totals.income)}`, tone: 'cc-t-green' },
    { label: 'Egresos', value: `−${signedRmb(props.data.totals.expense)}`, tone: 'cc-t-orange' },
    { label: 'Saldo final del sistema', value: signedRmb(final), tone: final < 0 ? 'cc-t-red' : '' }
  ]
})

watch(() => props.open, () => { balance.value = null })
</script>
