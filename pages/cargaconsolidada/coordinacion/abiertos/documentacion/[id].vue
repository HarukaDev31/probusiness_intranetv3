<template>
  <ConsolidadoDocumentacionView
    :role="ROLES.COORDINACION"
    base-path="/cargaconsolidada/coordinacion/abiertos"
  />
</template>

<script setup lang="ts">
import ConsolidadoDocumentacionView from '~/components/cargaconsolidada/ConsolidadoDocumentacionView.vue'
import { ROLES } from '~/constants/roles'
</script>
