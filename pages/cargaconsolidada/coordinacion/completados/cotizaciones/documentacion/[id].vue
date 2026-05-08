<template>
  <CotizacionesDocumentacionView
    :role="ROLES.COORDINACION"
    base-path="/cargaconsolidada/coordinacion/completados"
  />
</template>

<script setup lang="ts">
import CotizacionesDocumentacionView from '~/components/cargaconsolidada/cotizaciones/CotizacionesDocumentacionView/index.vue'
import { ROLES } from '~/constants/roles'
</script>
