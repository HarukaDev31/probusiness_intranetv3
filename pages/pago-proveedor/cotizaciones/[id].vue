<template>
  <CotizacionForm :quote-id="Number(route.params.id)" />
</template>

<script setup lang="ts">
import CotizacionForm from '~/components/pago-proveedor/CotizacionForm.vue'

const route = useRoute()
</script>
