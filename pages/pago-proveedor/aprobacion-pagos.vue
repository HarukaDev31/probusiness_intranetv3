<template>
  <SupplierPaymentPage
    title="Pago a Proveedor"
    subtitle="Aprobación de pagos con depósitos validados en Verificación."
  >
    <SupplierPaymentApprovals />
  </SupplierPaymentPage>
</template>

<script setup lang="ts">
import SupplierPaymentPage from '~/components/pago-proveedor/SupplierPaymentPage.vue'
import SupplierPaymentApprovals from '~/components/pago-proveedor/SupplierPaymentApprovals.vue'
</script>
