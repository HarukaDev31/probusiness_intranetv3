<template>
  <FacturaGuiaView
    :role="ROLES.COORDINACION"
    base-path="/cargaconsolidada/coordinacion/abiertos"
    back-base-path="/cargaconsolidada/coordinacion/abiertos"
  />
</template>

<script setup lang="ts">
import FacturaGuiaView from '~/components/cargaconsolidada/FacturaGuiaView.vue'
import { ROLES } from '~/constants/roles'
</script>
