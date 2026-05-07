<template>
  <FacturaGuiaView
    :role="ROLES.DOCUMENTACION"
    base-path="/cargaconsolidada/documentacion/completados"
    back-base-path="/cargaconsolidada/documentacion/completados"
  />
</template>

<script setup lang="ts">
import FacturaGuiaView from '~/components/cargaconsolidada/factura-guia/FacturaGuiaView/index.vue'
import { ROLES } from '~/constants/roles'
</script>
