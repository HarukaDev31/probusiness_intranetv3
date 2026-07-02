<template>
  <CargaConsolidadaCompletadosView
    :role="ROLES.DOCUMENTACION"
    :back-route="backRoute"
    base-path="/cargaconsolidada/documentacion/completados"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'
import { ROLES } from '~/constants/roles'

definePageMeta({
  layout: 'default',
  name: 'cargaconsolidada-documentacion-completados',
  keepalive: true,
})

const CargaConsolidadaCompletadosView = createLazyView(() => import('~/components/cargaconsolidada/consolidado/CargaConsolidadaCompletadosView/index.vue'))

const backRoute = '/cargaconsolidada/documentacion'
</script>
