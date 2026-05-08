<template>
  <CotizacionesView
    :role="ROLES.COORDINACION"
    base-path="/cargaconsolidada/coordinacion/abiertos"
    back-base-path="/cargaconsolidada/coordinacion/abiertos"
  />
</template>

<script setup lang="ts">
import CotizacionesView from '~/components/cargaconsolidada/cotizaciones/CotizacionesView/index.vue'
import { ROLES } from '~/constants/roles'
</script>
