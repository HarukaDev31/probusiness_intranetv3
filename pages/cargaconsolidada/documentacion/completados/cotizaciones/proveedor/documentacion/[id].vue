<template>
  <CotizacionesProveedorDocumentacionView :role="ROLES.DOCUMENTACION" />
</template>

<script setup lang="ts">
import CotizacionesProveedorDocumentacionView from '~/components/cargaconsolidada/CotizacionesProveedorDocumentacionView.vue'
import { ROLES } from '~/constants/roles'
</script>
