<template>
  <FacturaGuiaClientesView base-path="/cargaconsolidada/completados" />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const FacturaGuiaClientesView = createLazyView(() => import('~/components/cargaconsolidada/factura-guia/FacturaGuiaClientesView/index.vue'))
</script>
