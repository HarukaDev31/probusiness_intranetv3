<template>
  <EntregaClientesView
    :role="ROLES.DOCUMENTACION"
    base-path="/cargaconsolidada/documentacion/abiertos"
    back-base-path="/cargaconsolidada/documentacion/abiertos"
  />
</template>

<script setup lang="ts">
import EntregaClientesView from '~/components/cargaconsolidada/entrega/EntregaClientesView/index.vue'
import { ROLES } from '~/constants/roles'
</script>
