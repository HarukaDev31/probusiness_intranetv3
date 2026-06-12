<template>
  <CotizacionesProveedorDocumentacionChinaView back-base-path="/cargaconsolidada/completados" />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const CotizacionesProveedorDocumentacionChinaView = createLazyView(() => import('~/components/cargaconsolidada/cotizaciones/CotizacionesProveedorDocumentacionChinaView/index.vue'))
</script>
