<template>
  <CotizacionFinalView
    :role="ROLES.COORDINACION"
    base-path="/cargaconsolidada/coordinacion/completados"
    back-base-path="/cargaconsolidada/coordinacion/completados"
  />
</template>

<script setup lang="ts">
import CotizacionFinalView from '~/components/cargaconsolidada/CotizacionFinalView.vue'
import { ROLES } from '~/constants/roles'
</script>
