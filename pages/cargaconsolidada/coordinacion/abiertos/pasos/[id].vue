<template>
  <ConsolidadoPasosView
    :role="ROLES.COORDINACION"
    back-route="/cargaconsolidada/coordinacion/abiertos"
    base-path="/cargaconsolidada/coordinacion/abiertos"
  />
</template>

<script setup lang="ts">
import ConsolidadoPasosView from '~/components/cargaconsolidada/ConsolidadoPasosView.vue'
import { ROLES } from '~/constants/roles'
</script>
