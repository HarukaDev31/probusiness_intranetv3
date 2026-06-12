<template>
  <CotizacionesDocumentacionView
    :role="ROLES.COORDINACION"
    base-path="/cargaconsolidada/coordinacion/abiertos"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const CotizacionesDocumentacionView = createLazyView(() => import('~/components/cargaconsolidada/cotizaciones/CotizacionesDocumentacionView/index.vue'))
import { ROLES } from '~/constants/roles'
</script>
