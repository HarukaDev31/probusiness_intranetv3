<template>
  <SupplierPaymentPage
    title="Pago a Proveedor"
    subtitle="Pagos en yuanes (RMB) a proveedores de China."
  >
    <SupplierPaymentYuan />
  </SupplierPaymentPage>
</template>

<script setup lang="ts">
import SupplierPaymentPage from '~/components/pago-proveedor/SupplierPaymentPage.vue'
import SupplierPaymentYuan from '~/components/pago-proveedor/SupplierPaymentYuan.vue'
</script>
