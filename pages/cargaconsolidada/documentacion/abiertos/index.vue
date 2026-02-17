<template>
  <CargaConsolidadaAbiertaView
    :role="ROLES.DOCUMENTACION"
    :back-route="backRoute"
    base-path="/cargaconsolidada/documentacion/abiertos"
  />
</template>

<script setup lang="ts">
import CargaConsolidadaAbiertaView from '~/components/cargaconsolidada/CargaConsolidadaAbiertaView.vue'
import { ROLES } from '~/constants/roles'

definePageMeta({
  layout: 'default',
})

const backRoute = '/cargaconsolidada/documentacion'
</script>
