<template>
  <SupplierPaymentPage title="Pagos" subtitle="Tus facturas con Pro Business, tus pagos y tu saldo a favor.">
    <template #actions>
      <UButton color="neutral" variant="outline" icon="i-heroicons-arrow-down-tray" @click="panel?.openBalance()">Descargar balance</UButton>
      <UButton color="primary" icon="i-heroicons-plus" @click="panel?.openFreePayment()">Registrar pago</UButton>
    </template>
    <PartnerBillingPanel ref="panel" />
  </SupplierPaymentPage>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PartnerBillingPanel from '~/components/partner-payments/PartnerBillingPanel.vue'
import SupplierPaymentPage from '~/components/pago-proveedor/SupplierPaymentPage.vue'

const panel = ref<InstanceType<typeof PartnerBillingPanel> | null>(null)
</script>
