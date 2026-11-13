<template>
  <UModal
    :open="!!deposit"
    title="Comprobante"
    :description="deposit ? `${deposit.client_name || 'Cliente'} · Consolidado ${deposit.consolidation || 'sin identificar'}` : undefined"
    :dismissible="true"
    :ui="{
      content: 'w-full max-w-4xl sm:max-w-4xl',
      header: 'border-t-[5px] border-t-primary-500',
      title: 'text-lg font-bold text-highlighted',
      description: 'text-sm text-muted'
    }"
    @update:open="onOpen"
  >
    <template #body>
      <VoucherViewer v-if="deposit" :url="deposit.voucher_url" :name="deposit.voucher_name" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import VoucherViewer from '~/components/pago-proveedor/VoucherViewer.vue'
import type { SupplierPaymentDeposit } from '~/types/pago-proveedor'

defineProps<{ deposit: SupplierPaymentDeposit | null }>()
const emit = defineEmits<{ close: [] }>()

function onOpen(value: boolean) {
  if (!value) emit('close')
}
</script>
