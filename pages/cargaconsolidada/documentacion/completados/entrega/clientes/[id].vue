<template>
  <EntregaClientesView
    :role="ROLES.DOCUMENTACION"
    base-path="/cargaconsolidada/documentacion/completados"
    back-base-path="/cargaconsolidada/documentacion/completados"
  />
</template>

<script setup lang="ts">
import EntregaClientesView from '~/components/cargaconsolidada/EntregaClientesView.vue'
import { ROLES } from '~/constants/roles'
</script>
