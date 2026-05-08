<template>
  <ClientesDocumentacionView
    :role="ROLES.DOCUMENTACION"
    base-path="/cargaconsolidada/documentacion/abiertos"
    back-base-path="/cargaconsolidada/documentacion/abiertos"
  />
</template>

<script setup lang="ts">
import ClientesDocumentacionView from '~/components/cargaconsolidada/clientes/ClientesDocumentacionView/index.vue'
import { ROLES } from '~/constants/roles'
</script>
