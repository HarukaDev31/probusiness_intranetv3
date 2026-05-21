<template>
  <EntregaView
    :role="ROLES.COORDINACION"
    base-path="/cargaconsolidada/coordinacion/abiertos"
    back-base-path="/cargaconsolidada/coordinacion/abiertos"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { ROLES } from '~/constants/roles'

const EntregaView = defineAsyncComponent(
  () => import('~/components/cargaconsolidada/entrega/EntregaView/index.vue')
)
</script>
