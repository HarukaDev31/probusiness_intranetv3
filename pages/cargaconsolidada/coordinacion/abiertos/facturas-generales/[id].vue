<template>
  <FacturasGeneralesView
    base-path="/cargaconsolidada/coordinacion/abiertos"
    back-base-path="/cargaconsolidada/coordinacion/abiertos"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const FacturasGeneralesView = createLazyView(() => import('~/components/cargaconsolidada/documentacion/FacturasGeneralesView/index.vue'))
</script>
