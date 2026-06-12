<template>
  <FacturaGuiaFormularioComprobanteView />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const FacturaGuiaFormularioComprobanteView = createLazyView(() => import('~/components/cargaconsolidada/factura-guia/FacturaGuiaFormularioComprobanteView/index.vue'))
</script>
