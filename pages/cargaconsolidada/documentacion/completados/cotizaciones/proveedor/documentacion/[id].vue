<template>
  <CotizacionesProveedorDocumentacionView :role="ROLES.DOCUMENTACION" />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const CotizacionesProveedorDocumentacionView = createLazyView(() => import('~/components/cargaconsolidada/cotizaciones/CotizacionesProveedorDocumentacionView/index.vue'))
import { ROLES } from '~/constants/roles'
</script>
