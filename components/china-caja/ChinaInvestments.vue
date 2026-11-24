<template>
  <section class="cc-card flex flex-col">
    <div class="flex flex-col gap-2 border-b border-(--cc-line) px-[18px] py-4">
      <span class="cc-title-row"><span class="cc-title">Inversiones anuales {{ year }}</span><span class="rounded-[20px] bg-(--cc-soft) px-2 py-px text-xs text-(--cc-body)">{{ investments.length }}</span><ChinaInfo topic="invs" /></span>
      <span class="flex justify-between text-[13px] text-(--cc-muted)"><span>Ejecutado {{ money(paid) }}</span><span>Presupuesto {{ money(total) }}</span></span>
      <span class="block h-2 overflow-hidden rounded bg-(--cc-empty)"><span class="block h-full bg-(--cc-chip)" :style="{ width: `${total ? Math.round(paid / total * 100) : 0}%` }" /></span>
    </div>
    <div class="max-h-[232px] overflow-y-auto">
      <div v-for="row in investments" :key="row.id" class="flex items-center gap-2.5 border-b border-(--cc-line) px-[18px] py-2.5">
        <span class="cc-grow flex flex-col gap-px"><span class="cc-cut text-sm">{{ row.name }}</span><span class="cc-sub">{{ row.paid_on ? 'Pagada' : 'Programada' }} {{ dmy(row.due_on, true) }}</span></span>
        <span class="flex flex-col items-end gap-[3px]">
          <span class="text-sm font-semibold">{{ money(row.amount) }}</span>
          <span v-if="row.paid_on" class="cc-c-green rounded-[20px] px-2 py-0.5 text-[11px]">Pagada</span>
          <button v-else type="button" class="cc-btn--soft rounded-[20px] border px-2 py-0.5 text-[11px]" @click="pay(row)">Marcar pagada</button>
        </span>
        <button type="button" class="cc-x" title="Eliminar" @click="remove(row)">×</button>
      </div>
    </div>
    <form class="grid grid-cols-[1fr_90px] gap-1.5 px-[18px] py-3" @submit.prevent="add">
      <UInput v-model="name" variant="none" placeholder="Nueva inversión" class="col-span-2" :ui="{ base: 'cc-input cc-input--small' }" />
      <UInput v-model="dueOn" type="date" variant="none" :ui="{ base: 'cc-input cc-input--small' }" />
      <UInputNumber v-model="amount" :min="0" :step="0.01" variant="none" placeholder="¥ monto" :ui="{ ...AMOUNT_UI, base: 'cc-input cc-input--small' }" />
      <button type="submit" class="cc-btn col-span-2 !rounded-lg !py-[9px] !text-[13px]">Agregar inversión</button>
    </form>

    <ChinaWindow :open="!!repeat" :title="`&quot;${repeat?.name || ''}&quot; marcada como pagada`" :subtitle="repeat ? `${money(repeat.amount)} · ${dmy(repeat.due_on, true)}` : ''" width="w-full max-w-[460px]" @close="repeat = null">
      <span class="text-[15px]">¿Vas a volver a invertir en este concepto?</span>
      <div v-if="asking === 'form'" class="grid grid-cols-2 gap-3">
        <label class="cc-field">Nueva fecha<UInput v-model="nextOn" type="date" variant="none" :ui="{ base: 'cc-input !text-[15px]' }" /></label>
        <label class="cc-field">Monto (¥)<UInputNumber v-model="nextAmount" :min="0" :step="0.01" variant="none" :ui="{ ...AMOUNT_UI, base: 'cc-input !text-[15px] font-semibold' }" /></label>
      </div>
      <template #footer>
        <button type="button" class="cc-btn cc-btn--plain" @click="repeat = null">{{ asking === 'form' ? 'Cancelar' : 'No' }}</button>
        <button v-if="asking === 'ask'" type="button" class="cc-btn !px-[22px]" @click="asking = 'form'">Sí</button>
        <button v-else type="button" class="cc-btn" :disabled="!nextOn || !nextAmount" @click="again">Programar inversión</button>
      </template>
    </ChinaWindow>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ChinaInfo from '~/components/china-caja/ChinaInfo.vue'
import ChinaWindow from '~/components/china-caja/ChinaWindow.vue'
import { useModal } from '~/composables/commons/useModal'
import { AMOUNT_UI } from '~/constants/chinaCaja'
import type { ChinaInvestment } from '~/types/china-caja'
import { dmy } from '~/utils/chinaCaja'

type NewInvestment = { name: string; amount: number; due_on: string; previous_id?: number }
const props = defineProps<{ investments: ChinaInvestment[]; year: string; money: (value: number) => string; payInvestment: (id: number) => Promise<boolean> }>()
const emit = defineEmits<{ add: [body: NewInvestment]; remove: [id: number] }>()
const { showConfirmation } = useModal()
const name = ref('')
const dueOn = ref('')
const amount = ref<number | null>(null)
const repeat = ref<ChinaInvestment | null>(null)
const asking = ref<'ask' | 'form'>('ask')
const nextOn = ref('')
const nextAmount = ref<number | null>(null)
const total = computed(() => props.investments.reduce((sum, row) => sum + row.amount, 0))
const paid = computed(() => props.investments.filter((row) => row.paid_on).reduce((sum, row) => sum + row.amount, 0))

function add() {
  if (!name.value.trim() || !dueOn.value || !amount.value) return
  emit('add', { name: name.value.trim(), due_on: dueOn.value, amount: amount.value })
  name.value = ''
  dueOn.value = ''
  amount.value = null
}

async function pay(row: ChinaInvestment) {
  if (!(await props.payInvestment(row.id))) return
  asking.value = 'ask'
  // Se propone la misma fecha del año siguiente.
  nextOn.value = `${Number(row.due_on.slice(0, 4)) + 1}${row.due_on.slice(4)}`
  nextAmount.value = row.amount
  repeat.value = row
}

function again() {
  if (!repeat.value || !nextAmount.value) return
  emit('add', { name: repeat.value.name, due_on: nextOn.value, amount: nextAmount.value, previous_id: repeat.value.id })
  repeat.value = null
}

function remove(row: ChinaInvestment) {
  showConfirmation(`¿Eliminar la inversión "${row.name}"?`, props.money(row.amount), () => emit('remove', row.id))
}
</script>
