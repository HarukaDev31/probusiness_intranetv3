<template>
  <CotizacionesView
    :role="ROLES.COORDINACION"
    base-path="/cargaconsolidada/coordinacion/completados"
    back-base-path="/cargaconsolidada/coordinacion/completados"
  />
</template>

<script setup lang="ts">
import CotizacionesView from '~/components/cargaconsolidada/CotizacionesView.vue'
import { ROLES } from '~/constants/roles'
</script>
