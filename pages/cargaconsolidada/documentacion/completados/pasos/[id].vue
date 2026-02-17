<template>
  <ConsolidadoPasosView
    :role="ROLES.DOCUMENTACION"
    back-route="/cargaconsolidada/documentacion/completados"
    base-path="/cargaconsolidada/documentacion/completados"
  />
</template>

<script setup lang="ts">
import ConsolidadoPasosView from '~/components/cargaconsolidada/ConsolidadoPasosView.vue'
import { ROLES } from '~/constants/roles'
</script>
