<template>
  <FacturasGeneralesView
    base-path="/cargaconsolidada/documentacion/completados"
    back-base-path="/cargaconsolidada/documentacion/completados"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const FacturasGeneralesView = createLazyView(() => import('~/components/cargaconsolidada/documentacion/FacturasGeneralesView/index.vue'))
</script>
