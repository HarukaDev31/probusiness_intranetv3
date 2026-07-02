<template>
  <CargaConsolidadaCompletadosView
    :role="ROLES.COORDINACION"
    :back-route="backRoute"
    base-path="/cargaconsolidada/coordinacion/completados"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'
import { ROLES } from '~/constants/roles'

definePageMeta({
  layout: 'default',
  name: 'cargaconsolidada-coordinacion-completados',
  keepalive: true,
})

const CargaConsolidadaCompletadosView = createLazyView(() => import('~/components/cargaconsolidada/consolidado/CargaConsolidadaCompletadosView/index.vue'))

const backRoute = '/cargaconsolidada/coordinacion'
</script>
