<template>
  <ClientesView
    :role="ROLES.COORDINACION"
    base-path="/cargaconsolidada/coordinacion/abiertos"
    back-base-path="/cargaconsolidada/coordinacion/abiertos"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const ClientesView = createLazyView(() => import('~/components/cargaconsolidada/clientes/ClientesView/index.vue'))
import { ROLES } from '~/constants/roles'
</script>
