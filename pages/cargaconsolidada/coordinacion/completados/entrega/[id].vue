<template>
  <EntregaView
    :role="ROLES.COORDINACION"
    base-path="/cargaconsolidada/coordinacion/completados"
    back-base-path="/cargaconsolidada/coordinacion/completados"
  />
</template>

<script setup lang="ts">
import EntregaView from '~/components/cargaconsolidada/entrega/EntregaView/index.vue'
import { ROLES } from '~/constants/roles'
</script>
