<template>
  <FacturaGuiaView
    :role="ROLES.DOCUMENTACION"
    base-path="/cargaconsolidada/documentacion/abiertos"
    back-base-path="/cargaconsolidada/documentacion/abiertos"
  />
</template>

<script setup lang="ts">
import FacturaGuiaView from '~/components/cargaconsolidada/FacturaGuiaView.vue'
import { ROLES } from '~/constants/roles'
</script>
