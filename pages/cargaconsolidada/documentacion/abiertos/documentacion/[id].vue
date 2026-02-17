<template>
  <ConsolidadoDocumentacionView
    :role="ROLES.DOCUMENTACION"
    base-path="/cargaconsolidada/documentacion/abiertos"
  />
</template>

<script setup lang="ts">
import ConsolidadoDocumentacionView from '~/components/cargaconsolidada/ConsolidadoDocumentacionView.vue'
import { ROLES } from '~/constants/roles'
</script>
