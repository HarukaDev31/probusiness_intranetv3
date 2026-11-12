<template>
  <div class="md:p-6" :class="{ 'supplier-payment-wide-tables': wideTables }">
    <!-- Cabecera única: icono + nombre de la sección (título) y debajo «Pago a proveedor» en letra pequeña.
         Las vistas de Pago a Proveedor arrancan a la misma altura, así cambiar de pestaña no mueve el diseño. -->
    <header class="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div class="min-w-0">
        <h1 class="flex items-center gap-2 text-xl font-bold text-highlighted md:text-2xl">
          <UIcon :name="icon" class="size-6 shrink-0 text-primary" />
          <span class="truncate">{{ title }}</span>
        </h1>
        <p class="mt-0.5 text-xs text-muted">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </header>
    <slot />
  </div>
</template>

<script setup lang="ts">
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
