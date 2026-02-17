<template>
  <ConsolidadoPasosView
    :role="ROLES.DOCUMENTACION"
    back-route="/cargaconsolidada/documentacion/abiertos"
    base-path="/cargaconsolidada/documentacion/abiertos"
  />
</template>

<script setup lang="ts">
import ConsolidadoPasosView from '~/components/cargaconsolidada/ConsolidadoPasosView.vue'
import { ROLES } from '~/constants/roles'
</script>
