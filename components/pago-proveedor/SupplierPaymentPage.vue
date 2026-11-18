<template>
  <div class="md:p-6" :class="{ 'supplier-payment-wide-tables': wideTables }">
    <SupplierPaymentHeader :title="title" :subtitle="subtitle" :icon="icon">
      <template v-if="$slots.actions" #actions><slot name="actions" /></template>
    </SupplierPaymentHeader>
    <slot />
  </div>
</template>

<script setup lang="ts">
import SupplierPaymentHeader from '~/components/pago-proveedor/SupplierPaymentHeader.vue'

withDefaults(defineProps<{
  title?: string
  subtitle?: string
  icon?: string
  /** Las tablas ocupan todo el ancho útil (DataTable centra y encoge las tablas que no desbordan). */
  wideTables?: boolean
}>(), {
  title: 'Pago a Proveedor',
  subtitle: 'Pago a proveedor',
  icon: 'i-heroicons-banknotes',
  wideTables: false
})
</script>

<style>
/* DataTable deja las tablas sin desborde a su ancho natural y centradas (`utable-narrow`);
   en Pago a Proveedor se estiran a todo el ancho para dar aire a cliente y proveedor. */
.supplier-payment-wide-tables .table-scroll-container .utable-narrow {
  align-items: stretch;
}
.supplier-payment-wide-tables .table-scroll-container .utable-narrow table {
  width: 100% !important;
  min-width: 100% !important;
}
/* Menos relleno lateral por celda: el espacio queda para el contenido (cliente, proveedor). */
.supplier-payment-wide-tables .table-scroll-container th,
.supplier-payment-wide-tables .table-scroll-container td {
  padding-left: 0.625rem !important;
  padding-right: 0.625rem !important;
}
</style>
