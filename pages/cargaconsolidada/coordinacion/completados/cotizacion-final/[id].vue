<template>
  <CotizacionFinalView
    :role="ROLES.COORDINACION"
    base-path="/cargaconsolidada/coordinacion/completados"
    back-base-path="/cargaconsolidada/coordinacion/completados"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const CotizacionFinalView = createLazyView(() => import('~/components/cargaconsolidada/cotizacion-final/CotizacionFinalView/index.vue'))
import { ROLES } from '~/constants/roles'
</script>
