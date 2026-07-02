<template>
  <EntregaClientesView
    :role="ROLES.DOCUMENTACION"
    base-path="/cargaconsolidada/documentacion/abiertos"
    back-base-path="/cargaconsolidada/documentacion/abiertos"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { ROLES } from '~/constants/roles'

const EntregaClientesView = defineAsyncComponent(
  () => import('~/components/cargaconsolidada/entrega/EntregaClientesView/index.vue')
)
</script>
