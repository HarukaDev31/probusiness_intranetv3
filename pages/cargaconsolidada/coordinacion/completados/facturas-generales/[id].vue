<template>
  <FacturasGeneralesView
    base-path="/cargaconsolidada/coordinacion/completados"
    back-base-path="/cargaconsolidada/coordinacion/completados"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const FacturasGeneralesView = createLazyView(() => import('~/components/cargaconsolidada/documentacion/FacturasGeneralesView/index.vue'))
</script>
