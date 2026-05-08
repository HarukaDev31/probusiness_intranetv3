<template>
  <CotizacionesDocumentacionView
    :role="ROLES.DOCUMENTACION"
    base-path="/cargaconsolidada/documentacion/abiertos"
  />
</template>

<script setup lang="ts">
import CotizacionesDocumentacionView from '~/components/cargaconsolidada/cotizaciones/CotizacionesDocumentacionView/index.vue'
import { ROLES } from '~/constants/roles'
</script>
