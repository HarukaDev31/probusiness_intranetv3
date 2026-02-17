<template>
  <CargaConsolidadaCompletadosView
    :role="ROLES.COORDINACION"
    :back-route="backRoute"
    base-path="/cargaconsolidada/coordinacion/completados"
  />
</template>

<script setup lang="ts">
import CargaConsolidadaCompletadosView from '~/components/cargaconsolidada/CargaConsolidadaCompletadosView.vue'
import { ROLES } from '~/constants/roles'

definePageMeta({
  layout: 'default',
})

const backRoute = '/cargaconsolidada/coordinacion'
</script>
