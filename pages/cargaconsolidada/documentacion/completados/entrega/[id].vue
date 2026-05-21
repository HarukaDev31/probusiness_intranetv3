<template>
  <EntregaView
    :role="ROLES.DOCUMENTACION"
    base-path="/cargaconsolidada/documentacion/completados"
    back-base-path="/cargaconsolidada/documentacion/completados"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { ROLES } from '~/constants/roles'

const EntregaView = defineAsyncComponent(
  () => import('~/components/cargaconsolidada/entrega/EntregaView/index.vue')
)
</script>
