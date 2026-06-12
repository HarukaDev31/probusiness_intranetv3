<template>
  <ClientesView
    :role="ROLES.DOCUMENTACION"
    base-path="/cargaconsolidada/documentacion/abiertos"
    back-base-path="/cargaconsolidada/documentacion/abiertos"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const ClientesView = createLazyView(() => import('~/components/cargaconsolidada/clientes/ClientesView/index.vue'))
import { ROLES } from '~/constants/roles'
</script>
