<template>
  <ChinaWindow :open="!!week" :title="title" subtitle="Sube el pantallazo de la cuenta, escribe el saldo y revisa los USD que faltan cambiar." @close="emit('close')">
    <template v-if="week">
      <div class="cc-line"><span class="cc-t-muted">Saldo en banco según sistema</span><strong>{{ week.system_balance === null ? '—' : signedRmb(week.system_balance) }}</strong></div>
      <ChinaFileDrop :file="screenshot" label="Pantallazo del saldo de la cuenta" hint="Subir pantallazo" @pick="(file) => { screenshot = file }" />
      <label class="cc-field">Saldo con el que cierra la cuenta (¥)
        <UInputNumber v-model="balance" :step="0.01" variant="none" placeholder="0" :ui="{ ...AMOUNT_UI, base: 'cc-input !text-[17px] font-semibold' }" />
      </label>
      <div class="flex justify-between rounded-lg px-3 py-2.5 text-sm" :class="difference && Math.abs(difference) >= 1 ? 'bg-(--cc-red-bg)' : 'bg-(--cc-green-bg)'"><span>Diferencia con el sistema</span><strong :class="difference && Math.abs(difference) >= 1 ? 'cc-t-red' : 'cc-t-green'">{{ differenceText }}</strong></div>
      <div class="flex flex-col gap-2 border-t border-(--cc-line) pt-3">
        <span class="flex items-baseline justify-between text-[13px] font-medium text-(--cc-body)"><span>USD recibidos que faltan cambiar a RMB</span><strong class="cc-t-ink">${{ usdTotal.toLocaleString('en-US') }}</strong></span>
        <div v-for="row in week.usd_to_exchange" :key="row.id" class="flex flex-col gap-2 rounded-[10px] border border-(--cc-orange-line) bg-(--cc-orange-soft) px-3 py-2.5">
          <span class="flex justify-between gap-2.5">
            <span class="flex min-w-0 flex-col"><strong class="text-sm">{{ [row.code, row.operations.join(', '), row.client].filter(Boolean).join(' · ') }}</strong><span class="cc-sub">Confirmado {{ dmy(row.confirmed_on).slice(0, 5) }}{{ carried(row) }}</span></span>
            <strong class="whitespace-nowrap text-[15px]">${{ row.usd.toLocaleString('en-US') }}</strong>
          </span>
          <span><button type="button" class="cc-btn cc-btn--xs" @click="emit('open-payment', row.id)">Ya lo cambié · ir a la operación →</button></span>
        </div>
        <span v-if="!week.usd_to_exchange.length" class="cc-c-green rounded-[10px] px-3 py-2.5 text-[13px]">✓ No hay USD pendientes de cambiar</span>
        <span v-else class="cc-sub">Si cierras la semana sin cambiarlos, pasan solos a la semana siguiente.</span>
      </div>
    </template>
    <template #footer>
      <button type="button" class="cc-btn cc-btn--plain" @click="emit('close')">Cancelar</button>
      <button type="button" class="cc-btn" :disabled="balance === null || !screenshot" @click="save">Cerrar semana</button>
    </template>
  </ChinaWindow>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ChinaFileDrop from '~/components/china-caja/ChinaFileDrop.vue'
import ChinaWindow from '~/components/china-caja/ChinaWindow.vue'
import { AMOUNT_UI } from '~/constants/chinaCaja'
import type { ChinaCashWeek, ChinaUsdToExchange } from '~/types/china-caja'
import { dmy, signedRmb, weekRange } from '~/utils/chinaCaja'

const props = defineProps<{ week: ChinaCashWeek | null }>()
const emit = defineEmits<{ close: []; save: [startsOn: string, balance: number, screenshot: File]; 'open-payment': [id: number] }>()
const balance = ref<number | null>(null)
const screenshot = ref<File | null>(null)

const title = computed(() => (props.week ? `Cerrar semana ${props.week.index + 1} (${weekRange(props.week)})` : 'Cerrar semana'))
const usdTotal = computed(() => (props.week?.usd_to_exchange || []).reduce((sum, row) => sum + row.usd, 0))
const difference = computed(() => (balance.value === null || !props.week || props.week.system_balance === null ? null : balance.value - props.week.system_balance))
const differenceText = computed(() => {
  if (difference.value === null) return '—'
  if (Math.abs(difference.value) < 1) return 'Cuadra'
  return `${difference.value > 0 ? '+' : ''}${signedRmb(difference.value)}`
})

watch(() => props.week, () => {
  balance.value = null
  screenshot.value = null
})

/** Lo que no se cambió en su semana viene arrastrado. */
function carried(row: ChinaUsdToExchange) {
  if (row.from_week === null) return ' · viene del mes anterior'
  return props.week && row.from_week <= props.week.index ? ` · viene de la semana ${row.from_week}` : ''
}

function save() {
  if (props.week && balance.value !== null && screenshot.value) emit('save', props.week.starts_on, balance.value, screenshot.value)
}
</script>
