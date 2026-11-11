<template>
  <SupplierPaymentPage
    title="Pagos en yuanes"
    subtitle="Pago a proveedor"
    icon="i-heroicons-currency-yen"
  >
    <SupplierPaymentYuan />
  </SupplierPaymentPage>
</template>

<script setup lang="ts">
import SupplierPaymentPage from '~/components/pago-proveedor/SupplierPaymentPage.vue'
import SupplierPaymentYuan from '~/components/pago-proveedor/SupplierPaymentYuan.vue'
</script>
