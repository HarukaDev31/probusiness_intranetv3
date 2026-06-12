<template>
  <CotizacionesView
    :role="ROLES.COORDINACION"
    base-path="/cargaconsolidada/coordinacion/abiertos"
    back-base-path="/cargaconsolidada/coordinacion/abiertos"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const CotizacionesView = createLazyView(() => import('~/components/cargaconsolidada/cotizaciones/CotizacionesView/index.vue'))
import { ROLES } from '~/constants/roles'
</script>
