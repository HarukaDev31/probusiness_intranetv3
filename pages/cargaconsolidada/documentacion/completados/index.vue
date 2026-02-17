<template>
  <CargaConsolidadaCompletadosView
    :role="ROLES.DOCUMENTACION"
    :back-route="backRoute"
    base-path="/cargaconsolidada/documentacion/completados"
  />
</template>

<script setup lang="ts">
import CargaConsolidadaCompletadosView from '~/components/cargaconsolidada/CargaConsolidadaCompletadosView.vue'
import { ROLES } from '~/constants/roles'

definePageMeta({
  layout: 'default',
})

const backRoute = '/cargaconsolidada/documentacion'
</script>
