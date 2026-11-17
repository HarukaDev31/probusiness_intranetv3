<template>
  <SupplierPaymentPage wide-tables title="Flujo de caja" subtitle="Cobros que entran a caja y pagos que salen en China.">
    <div class="grid gap-4 sm:grid-cols-2">
      <UCard>
        <p class="text-sm font-semibold uppercase tracking-wide text-primary">In</p>
        <h2 class="mt-2 text-xl font-bold text-highlighted">Ingresos</h2>
        <p class="mt-1 text-sm text-muted">Cobros recibidos de socios y otros ingresos a caja.</p>
        <UButton class="mt-4 px-0" color="primary" variant="link" to="/operaciones-china" trailing-icon="i-lucide-arrow-right">Abrir</UButton>
      </UCard>
      <UCard>
        <p class="text-sm font-semibold uppercase tracking-wide text-primary">Sa</p>
        <h2 class="mt-2 text-xl font-bold text-highlighted">Salidas</h2>
        <p class="mt-1 text-sm text-muted">Pagos a proveedores y gastos operativos en China.</p>
        <UButton class="mt-4 px-0" color="primary" variant="link" to="/pago-proveedor/pagos-yuanes" trailing-icon="i-lucide-arrow-right">Abrir</UButton>
      </UCard>
    </div>
  </SupplierPaymentPage>
</template>

<script setup lang="ts">
import SupplierPaymentPage from '~/components/pago-proveedor/SupplierPaymentPage.vue'
</script>
