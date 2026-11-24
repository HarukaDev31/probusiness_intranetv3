<template>
  <UCard>
    <h2 class="text-lg font-bold text-highlighted">Inversiones anuales</h2>
    <p class="mb-2 text-sm text-muted">Pagado {{ rmb(paid) }} de {{ rmb(total) }}</p>
    <UProgress class="mb-2" :model-value="total ? paid / total * 100 : 0" />
    <div v-for="row in investments" :key="row.id" class="flex items-center gap-3 border-t border-default py-2 text-sm">
      <span class="flex-1">{{ row.name }} <span class="text-muted">{{ dayLabel(row.due_on) }}</span></span>
      <strong>{{ rmb(row.amount) }}</strong>
      <UBadge v-if="row.paid_on" color="success" variant="soft">Pagada</UBadge>
      <template v-else>
        <UButton size="xs" variant="outline" @click="openPay(row)">Marcar pagada</UButton>
        <UButton size="xs" color="error" variant="ghost" icon="i-heroicons-x-mark" aria-label="Eliminar" @click="remove(row)" />
      </template>
    </div>
    <form class="mt-3 flex flex-wrap gap-2" @submit.prevent="add">
      <UInput v-model="name" placeholder="Nombre" class="min-w-32 flex-1" />
      <UInput v-model="dueOn" type="date" class="w-36" />
      <UInputNumber v-model="amount" :min="0" :step="0.01" :ui="AMOUNT_UI" placeholder="RMB" class="w-28" />
      <UButton type="submit" :disabled="!name.trim() || !dueOn || !amount">Agregar</UButton>
    </form>

    <UModal :open="!!paying" title="Marcar inversión como pagada" :ui="MODAL_UI" @update:open="(value: boolean) => { if (!value) paying = null }">
      <template #body>
        <div v-if="paying" class="flex flex-col gap-3">
          <UFormField :label="`Fecha de pago de ${paying.name}`"><UInput v-model="paidOn" type="date" class="w-full" /></UFormField>
          <UCheckbox v-model="again" label="¿Se vuelve a invertir?" />
          <div v-if="again" class="grid grid-cols-2 gap-2">
            <UInput v-model="againOn" type="date" />
            <UInputNumber v-model="againAmount" :min="0" :step="0.01" :ui="AMOUNT_UI" placeholder="RMB" />
          </div>
        </div>
      </template>
      <template #footer>
        <UButton class="ml-auto" :disabled="!paidOn || (again && (!againOn || !againAmount))" @click="pay">Guardar</UButton>
      </template>
    </UModal>
  </UCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useModal } from '~/composables/commons/useModal'
import { AMOUNT_UI, MODAL_UI } from '~/constants/chinaCaja'
import type { ChinaInvestment } from '~/types/china-caja'
import { chinaToday } from '~/utils/chinaCaja'
import { dayLabel, rmb } from '~/utils/yuanFormat'

const props = defineProps<{ investments: ChinaInvestment[] }>()
const emit = defineEmits<{
  add: [body: { name: string; amount: number; due_on: string }]
  pay: [id: number, body: { paid_on: string; again_on?: string; again_amount?: number }]
  remove: [id: number]
}>()
const { showConfirmation } = useModal()
const name = ref('')
const dueOn = ref('')
const amount = ref<number | null>(null)
const paying = ref<ChinaInvestment | null>(null)
const paidOn = ref('')
const again = ref(false)
const againOn = ref('')
const againAmount = ref<number | null>(null)
const total = computed(() => props.investments.reduce((sum, row) => sum + row.amount, 0))
const paid = computed(() => props.investments.filter((row) => row.paid_on).reduce((sum, row) => sum + row.amount, 0))

function add() {
  if (!name.value.trim() || !dueOn.value || !amount.value) return
  emit('add', { name: name.value.trim(), due_on: dueOn.value, amount: amount.value })
  name.value = ''
  dueOn.value = ''
  amount.value = null
}

function openPay(row: ChinaInvestment) {
  paying.value = row
  paidOn.value = chinaToday()
  again.value = false
  againOn.value = ''
  againAmount.value = row.amount
}

function pay() {
  if (!paying.value) return
  emit('pay', paying.value.id, { paid_on: paidOn.value, ...(again.value && againAmount.value ? { again_on: againOn.value, again_amount: againAmount.value } : {}) })
  paying.value = null
}

function remove(row: ChinaInvestment) {
  showConfirmation('¿Eliminar la inversión?', row.name, () => emit('remove', row.id))
}
</script>
