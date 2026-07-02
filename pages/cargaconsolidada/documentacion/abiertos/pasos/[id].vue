<template>
  <ConsolidadoPasosView
    :role="ROLES.DOCUMENTACION"
    back-route="/cargaconsolidada/documentacion/abiertos"
    base-path="/cargaconsolidada/documentacion/abiertos"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const ConsolidadoPasosView = createLazyView(() => import('~/components/cargaconsolidada/consolidado/ConsolidadoPasosView/index.vue'))
import { ROLES } from '~/constants/roles'
</script>
