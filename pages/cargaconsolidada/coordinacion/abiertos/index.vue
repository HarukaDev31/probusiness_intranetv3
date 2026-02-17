<template>
  <CargaConsolidadaAbiertaView
    :role="ROLES.COORDINACION"
    :back-route="backRoute"
    base-path="/cargaconsolidada/coordinacion/abiertos"
  />
</template>

<script setup lang="ts">
import CargaConsolidadaAbiertaView from '~/components/cargaconsolidada/CargaConsolidadaAbiertaView.vue'
import { ROLES } from '~/constants/roles'

definePageMeta({
  layout: 'default',
})

const backRoute = '/cargaconsolidada/coordinacion'
</script>
