<template>
  <ConsolidadoAduanaView base-path="/cargaconsolidada/coordinacion/abiertos" />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const ConsolidadoAduanaView = createLazyView(() => import('~/components/cargaconsolidada/consolidado/ConsolidadoAduanaView/index.vue'))
</script>
