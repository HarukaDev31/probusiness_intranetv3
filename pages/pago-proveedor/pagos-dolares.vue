<template>
  <SupplierPaymentPage
    title="Pagos en dólares"
    subtitle="Pago a proveedor"
    icon="i-heroicons-banknotes"
  >
    <SupplierPaymentExecutions />
  </SupplierPaymentPage>
</template>

<script setup lang="ts">
import SupplierPaymentPage from '~/components/pago-proveedor/SupplierPaymentPage.vue'
import SupplierPaymentExecutions from '~/components/pago-proveedor/SupplierPaymentExecutions.vue'
</script>
