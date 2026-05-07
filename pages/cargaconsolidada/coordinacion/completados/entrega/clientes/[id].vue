<template>
  <EntregaClientesView
    :role="ROLES.COORDINACION"
    base-path="/cargaconsolidada/coordinacion/completados"
    back-base-path="/cargaconsolidada/coordinacion/completados"
  />
</template>

<script setup lang="ts">
import EntregaClientesView from '~/components/cargaconsolidada/EntregaClientesView.vue'
import { ROLES } from '~/constants/roles'
</script>
