<template>
  <UCard variant="subtle">
    <p class="mb-1 font-semibold text-highlighted">Cuenta bancaria China</p>
    <USkeleton v-if="loading" class="h-16 w-full" />
    <p v-else-if="!account || !account.company" class="text-sm text-muted">Aún no hay datos bancarios cargados.</p>
    <div v-else class="grid gap-4 text-sm">
      <p class="font-medium">{{ account.company }}<span v-if="account.company_address" class="block text-xs font-normal text-muted">{{ account.company_address }}</span></p>
      <div v-for="section in sections" :key="section.title">
        <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">{{ section.title }}</p>
        <dl class="grid gap-x-4 gap-y-0.5 sm:grid-cols-[10rem_1fr]">
          <template v-for="row in section.rows" :key="row.label">
            <dt class="text-muted">{{ row.label }}</dt><dd class="font-medium">{{ account[row.key] || '—' }}</dd>
          </template>
        </dl>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ChinaBillingService } from '~/services/chinaBillingService'
import type { ChinaBankAccount } from '~/types/china-billing'

const account = ref<ChinaBankAccount | null>(null)
type Row = { label: string; key: keyof ChinaBankAccount }
const sections: { title: string; rows: Row[] }[] = [
  { title: 'Banco intermediario', rows: [
    { label: 'Código Swift', key: 'intermediary_swift' }, { label: 'Nombre del banco', key: 'intermediary_bank' },
    { label: 'País', key: 'intermediary_country' }, { label: 'Estado', key: 'intermediary_state' }, { label: 'Ciudad', key: 'intermediary_city' }
  ] },
  { title: 'Banco pagador', rows: [
    { label: 'Código Swift', key: 'payer_swift' }, { label: 'Nombre del banco', key: 'payer_bank' },
    { label: 'País', key: 'payer_country' }, { label: 'Estado', key: 'payer_state' }, { label: 'Ciudad', key: 'payer_city' }
  ] },
  { title: 'Beneficiario', rows: [
    { label: 'Cuenta', key: 'account_number' }, { label: 'Beneficiario', key: 'beneficiary' }, { label: 'Dirección', key: 'beneficiary_address' },
    { label: 'País', key: 'beneficiary_country' }, { label: 'Estado', key: 'beneficiary_state' }, { label: 'Ciudad', key: 'beneficiary_city' }
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
