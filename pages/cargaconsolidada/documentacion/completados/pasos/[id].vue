<template>
  <ConsolidadoPasosView
    :role="ROLES.DOCUMENTACION"
    back-route="/cargaconsolidada/documentacion/completados"
    base-path="/cargaconsolidada/documentacion/completados"
  />
</template>

<script setup lang="ts">
import ConsolidadoPasosView from '~/components/cargaconsolidada/consolidado/ConsolidadoPasosView/index.vue'
import { ROLES } from '~/constants/roles'
</script>
