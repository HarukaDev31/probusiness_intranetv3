<template>
  <ClientesDocumentacionView
    :role="ROLES.COORDINACION"
    base-path="/cargaconsolidada/coordinacion/completados"
    back-base-path="/cargaconsolidada/coordinacion/completados"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const ClientesDocumentacionView = createLazyView(() => import('~/components/cargaconsolidada/clientes/ClientesDocumentacionView/index.vue'))
import { ROLES } from '~/constants/roles'
</script>
