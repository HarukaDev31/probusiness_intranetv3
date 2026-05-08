<template>
  <CotizacionFinalView
    :role="ROLES.DOCUMENTACION"
    base-path="/cargaconsolidada/documentacion/abiertos"
    back-base-path="/cargaconsolidada/documentacion/abiertos"
  />
</template>

<script setup lang="ts">
import CotizacionFinalView from '~/components/cargaconsolidada/cotizacion-final/CotizacionFinalView/index.vue'
import { ROLES } from '~/constants/roles'
</script>
