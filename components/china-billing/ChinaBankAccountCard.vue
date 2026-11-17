<template>
  <div>
    <USkeleton v-if="loading" class="h-16 w-full" />
    <p v-else-if="!account || !account.company" class="text-sm text-muted">Aún no hay datos bancarios cargados.</p>
    <div v-else class="grid gap-x-8 gap-y-5 text-sm md:grid-cols-3">
      <div v-for="section in sections" :key="section.title">
        <p class="mb-2 border-b border-default pb-1.5 text-xs font-semibold uppercase tracking-wider text-highlighted">{{ section.title }}</p>
        <dl class="grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-2">
          <template v-for="row in section.rows" :key="row.label">
            <dt class="text-muted">{{ row.label }}</dt><dd class="font-medium break-words">{{ value(row) }}</dd>
          </template>
        </dl>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ChinaBillingService } from '~/services/chinaBillingService'
import type { ChinaBankAccount } from '~/types/china-billing'

const account = ref<ChinaBankAccount | null>(null)
type Row = { label: string; keys: (keyof ChinaBankAccount)[] }
const value = (row: Row) => row.keys.map((key) => account.value?.[key]).filter(Boolean).join(' · ') || '—'
const sections: { title: string; rows: Row[] }[] = [
  { title: 'Banco intermediario', rows: [
    { label: 'Swift', keys: ['intermediary_swift'] }, { label: 'Banco', keys: ['intermediary_bank'] },
    { label: 'País', keys: ['intermediary_country'] }, { label: 'Estado / Ciudad', keys: ['intermediary_state', 'intermediary_city'] }
  ] },
  { title: 'Banco pagador', rows: [
    { label: 'Swift', keys: ['payer_swift'] }, { label: 'Banco', keys: ['payer_bank'] },
    { label: 'País', keys: ['payer_country'] }, { label: 'Estado / Ciudad', keys: ['payer_state', 'payer_city'] }
  ] },
  { title: 'Beneficiario', rows: [
    { label: 'Cuenta', keys: ['account_number'] }, { label: 'Beneficiario', keys: ['beneficiary'] }, { label: 'Dirección', keys: ['beneficiary_address'] },
    { label: 'País / Ciudad', keys: ['beneficiary_country', 'beneficiary_state', 'beneficiary_city'] }
  ] }
]
const loading = ref(true)

onMounted(async () => {
  try {
    account.value = (await ChinaBillingService.bankAccount()).data
  } catch {
    account.value = null
  } finally {
    loading.value = false
  }
})
</script>
