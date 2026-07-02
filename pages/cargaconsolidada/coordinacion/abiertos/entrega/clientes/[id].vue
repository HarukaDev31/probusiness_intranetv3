<template>
  <EntregaClientesView
    :role="ROLES.COORDINACION"
    base-path="/cargaconsolidada/coordinacion/abiertos"
    back-base-path="/cargaconsolidada/coordinacion/abiertos"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { ROLES } from '~/constants/roles'

const EntregaClientesView = defineAsyncComponent(
  () => import('~/components/cargaconsolidada/entrega/EntregaClientesView/index.vue')
)
</script>
