<template>
  <CotizacionesDocumentacionView
    :role="ROLES.DOCUMENTACION"
    base-path="/cargaconsolidada/documentacion/completados"
  />
</template>

<script setup lang="ts">
import CotizacionesDocumentacionView from '~/components/cargaconsolidada/CotizacionesDocumentacionView.vue'
import { ROLES } from '~/constants/roles'
</script>
