<template>
  <SupplierPaymentPage
    title="Pago en Dólares (T-T)"
    subtitle="Pago a proveedor"
    icon="i-heroicons-banknotes"
    wide-tables
  >
    <SupplierPaymentExecutions />
  </SupplierPaymentPage>
</template>

<script setup lang="ts">
import SupplierPaymentPage from '~/components/pago-proveedor/SupplierPaymentPage.vue'
import SupplierPaymentExecutions from '~/components/pago-proveedor/SupplierPaymentExecutions.vue'
</script>
