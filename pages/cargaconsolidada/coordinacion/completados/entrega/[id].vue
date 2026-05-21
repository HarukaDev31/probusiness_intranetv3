<template>
  <EntregaView
    :role="ROLES.COORDINACION"
    base-path="/cargaconsolidada/coordinacion/completados"
    back-base-path="/cargaconsolidada/coordinacion/completados"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { ROLES } from '~/constants/roles'

const EntregaView = defineAsyncComponent(
  () => import('~/components/cargaconsolidada/entrega/EntregaView/index.vue')
)
</script>
