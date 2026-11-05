<template>
  <SupplierPaymentPage
    title="Pago a Proveedor"
    subtitle="Ejecución de pagos en dólares (T-T) que realiza Administración."
  >
    <SupplierPaymentExecutions />
  </SupplierPaymentPage>
</template>

<script setup lang="ts">
import SupplierPaymentPage from '~/components/pago-proveedor/SupplierPaymentPage.vue'
import SupplierPaymentExecutions from '~/components/pago-proveedor/SupplierPaymentExecutions.vue'
</script>
