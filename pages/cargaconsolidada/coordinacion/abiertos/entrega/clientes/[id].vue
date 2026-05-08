<template>
  <EntregaClientesView
    :role="ROLES.COORDINACION"
    base-path="/cargaconsolidada/coordinacion/abiertos"
    back-base-path="/cargaconsolidada/coordinacion/abiertos"
  />
</template>

<script setup lang="ts">
import EntregaClientesView from '~/components/cargaconsolidada/entrega/EntregaClientesView/index.vue'
import { ROLES } from '~/constants/roles'
</script>
