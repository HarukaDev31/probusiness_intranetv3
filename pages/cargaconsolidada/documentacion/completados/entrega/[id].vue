<template>
  <EntregaView
    :role="ROLES.DOCUMENTACION"
    base-path="/cargaconsolidada/documentacion/completados"
    back-base-path="/cargaconsolidada/documentacion/completados"
  />
</template>

<script setup lang="ts">
import EntregaView from '~/components/cargaconsolidada/entrega/EntregaView/index.vue'
import { ROLES } from '~/constants/roles'
</script>
