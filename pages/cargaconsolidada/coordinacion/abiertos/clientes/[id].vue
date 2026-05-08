<template>
  <ClientesView
    :role="ROLES.COORDINACION"
    base-path="/cargaconsolidada/coordinacion/abiertos"
    back-base-path="/cargaconsolidada/coordinacion/abiertos"
  />
</template>

<script setup lang="ts">
import ClientesView from '~/components/cargaconsolidada/clientes/ClientesView/index.vue'
import { ROLES } from '~/constants/roles'
</script>
