<template>
  <SupplierPaymentPage
    title="Aprobación de pagos"
    subtitle="Pago a proveedor"
    icon="i-heroicons-check-badge"
  >
    <SupplierPaymentApprovals />
  </SupplierPaymentPage>
</template>

<script setup lang="ts">
import SupplierPaymentPage from '~/components/pago-proveedor/SupplierPaymentPage.vue'
import SupplierPaymentApprovals from '~/components/pago-proveedor/SupplierPaymentApprovals.vue'
</script>
