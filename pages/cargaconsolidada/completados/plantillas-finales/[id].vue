<template>
  <PlantillasFinalesView
    base-path="/cargaconsolidada/completados"
    back-base-path="/cargaconsolidada/completados"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const PlantillasFinalesView = createLazyView(() => import('~/components/cargaconsolidada/cotizacion-final/PlantillasFinalesView/index.vue'))
</script>
