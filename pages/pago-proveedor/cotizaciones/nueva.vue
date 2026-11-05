<template>
  <CotizacionForm :codigo-cc="String(route.query.cc || '')" />
</template>

<script setup lang="ts">
import CotizacionForm from '~/components/pago-proveedor/CotizacionForm.vue'

const route = useRoute()
</script>
