<template>
  <CotizacionesDocumentacionView
    :role="ROLES.DOCUMENTACION"
    base-path="/cargaconsolidada/documentacion/abiertos"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const CotizacionesDocumentacionView = createLazyView(() => import('~/components/cargaconsolidada/cotizaciones/CotizacionesDocumentacionView/index.vue'))
import { ROLES } from '~/constants/roles'
</script>
