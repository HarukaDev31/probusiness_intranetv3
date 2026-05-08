<template>
  <CotizacionesProveedorDocumentacionView :role="ROLES.COORDINACION" />
</template>

<script setup lang="ts">
import CotizacionesProveedorDocumentacionView from '~/components/cargaconsolidada/cotizaciones/CotizacionesProveedorDocumentacionView/index.vue'
import { ROLES } from '~/constants/roles'
</script>
