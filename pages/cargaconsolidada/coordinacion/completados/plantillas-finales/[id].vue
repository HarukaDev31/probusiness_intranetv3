<template>
  <PlantillasFinalesView
    base-path="/cargaconsolidada/coordinacion/completados"
    back-base-path="/cargaconsolidada/coordinacion/completados"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const PlantillasFinalesView = createLazyView(() => import('~/components/cargaconsolidada/cotizacion-final/PlantillasFinalesView/index.vue'))
</script>
