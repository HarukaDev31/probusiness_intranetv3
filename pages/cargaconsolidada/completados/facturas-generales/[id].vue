<template>
  <FacturasGeneralesView
    base-path="/cargaconsolidada/completados"
    back-base-path="/cargaconsolidada/completados"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const FacturasGeneralesView = createLazyView(() => import('~/components/cargaconsolidada/documentacion/FacturasGeneralesView/index.vue'))
</script>
