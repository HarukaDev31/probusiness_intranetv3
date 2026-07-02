<template>
  <CotizacionFinalView
    :role="ROLES.DOCUMENTACION"
    base-path="/cargaconsolidada/documentacion/abiertos"
    back-base-path="/cargaconsolidada/documentacion/abiertos"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const CotizacionFinalView = createLazyView(() => import('~/components/cargaconsolidada/cotizacion-final/CotizacionFinalView/index.vue'))
import { ROLES } from '~/constants/roles'
</script>
