<template>
  <CotizacionFinalView
    :role="ROLES.COORDINACION"
    base-path="/cargaconsolidada/coordinacion/abiertos"
    back-base-path="/cargaconsolidada/coordinacion/abiertos"
  />
</template>

<script setup lang="ts">
import CotizacionFinalView from '~/components/cargaconsolidada/cotizacion-final/CotizacionFinalView/index.vue'
import { ROLES } from '~/constants/roles'
</script>
