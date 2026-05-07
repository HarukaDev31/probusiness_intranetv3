<template>
  <ClientesView
    :role="ROLES.DOCUMENTACION"
    base-path="/cargaconsolidada/documentacion/abiertos"
    back-base-path="/cargaconsolidada/documentacion/abiertos"
  />
</template>

<script setup lang="ts">
import ClientesView from '~/components/cargaconsolidada/clientes/ClientesView/index.vue'
import { ROLES } from '~/constants/roles'
</script>
