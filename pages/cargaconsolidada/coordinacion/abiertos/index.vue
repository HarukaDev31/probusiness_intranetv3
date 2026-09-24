<template>
  <CargaConsolidadaAbiertaView
    :role="ROLES.COORDINACION"
    :back-route="backRoute"
    base-path="/cargaconsolidada/coordinacion/abiertos"
  />
</template>

<script setup lang="ts">
import CargaConsolidadaAbiertaView from '~/components/cargaconsolidada/consolidado/CargaConsolidadaAbiertaView/index.vue'
import { ROLES } from '~/constants/roles'

definePageMeta({
  layout: 'default',
  name: 'cargaconsolidada-coordinacion-abiertos',
  keepalive: true,
})

const backRoute = '/cargaconsolidada/coordinacion'
</script>
