<template>
  <ConsolidadoDocumentacionView
    :role="ROLES.COORDINACION"
    base-path="/cargaconsolidada/coordinacion/completados"
  />
</template>

<script setup lang="ts">
import ConsolidadoDocumentacionView from '~/components/cargaconsolidada/consolidado/ConsolidadoDocumentacionView/index.vue'
import { ROLES } from '~/constants/roles'
</script>
