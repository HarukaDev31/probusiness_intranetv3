<template>
  <UCard variant="subtle">
    <p class="mb-1 font-semibold text-highlighted">Cuenta bancaria China</p>
    <USkeleton v-if="loading" class="h-16 w-full" />
    <p v-else-if="!account || !account.company" class="text-sm text-muted">Aún no hay datos bancarios cargados.</p>
    <dl v-else class="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
      <div><dt class="text-muted">Empresa</dt><dd class="font-medium">{{ account.company }}</dd></div>
      <div><dt class="text-muted">Beneficiario</dt><dd class="font-medium">{{ account.beneficiary || '—' }}</dd></div>
      <div><dt class="text-muted">Banco intermediario</dt><dd class="font-medium">{{ account.intermediary_bank || '—' }}</dd></div>
      <div><dt class="text-muted">Banco pagador</dt><dd class="font-medium">{{ account.payer_bank || '—' }}</dd></div>
      <div class="sm:col-span-2"><dt class="text-muted">Cuenta</dt><dd class="font-medium">{{ account.account_number || '—' }}</dd></div>
    </dl>
  </UCard>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ChinaBillingService } from '~/services/chinaBillingService'
import type { ChinaBankAccount } from '~/types/china-billing'

const account = ref<ChinaBankAccount | null>(null)
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
