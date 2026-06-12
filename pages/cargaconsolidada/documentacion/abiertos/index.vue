<template>
  <CargaConsolidadaAbiertaView
    :role="ROLES.DOCUMENTACION"
    :back-route="backRoute"
    base-path="/cargaconsolidada/documentacion/abiertos"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'
import { ROLES } from '~/constants/roles'

definePageMeta({
  layout: 'default',
  name: 'cargaconsolidada-documentacion-abiertos',
  keepalive: true,
})

const CargaConsolidadaAbiertaView = createLazyView(() => import('~/components/cargaconsolidada/consolidado/CargaConsolidadaAbiertaView/index.vue'))

const backRoute = '/cargaconsolidada/documentacion'
</script>
