<template>
  <CargaConsolidadaAbiertaView
    :role="ROLES.COORDINACION"
    :back-route="backRoute"
    base-path="/cargaconsolidada/coordinacion/abiertos"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'
import { ROLES } from '~/constants/roles'

definePageMeta({
  layout: 'default',
  name: 'cargaconsolidada-coordinacion-abiertos',
  keepalive: true,
})

const CargaConsolidadaAbiertaView = createLazyView(() => import('~/components/cargaconsolidada/consolidado/CargaConsolidadaAbiertaView/index.vue'))

const backRoute = '/cargaconsolidada/coordinacion'
</script>
