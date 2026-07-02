<template>
  <ClientesDocumentacionView
    :role="ROLES.DOCUMENTACION"
    base-path="/cargaconsolidada/documentacion/completados"
    back-base-path="/cargaconsolidada/documentacion/completados"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const ClientesDocumentacionView = createLazyView(() => import('~/components/cargaconsolidada/clientes/ClientesDocumentacionView/index.vue'))
import { ROLES } from '~/constants/roles'
</script>
