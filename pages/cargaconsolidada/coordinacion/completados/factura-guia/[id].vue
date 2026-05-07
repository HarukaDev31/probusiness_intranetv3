<template>
  <FacturaGuiaView
    :role="ROLES.COORDINACION"
    base-path="/cargaconsolidada/coordinacion/completados"
    back-base-path="/cargaconsolidada/coordinacion/completados"
  />
</template>

<script setup lang="ts">
import FacturaGuiaView from '~/components/cargaconsolidada/factura-guia/FacturaGuiaView/index.vue'
import { ROLES } from '~/constants/roles'
</script>
