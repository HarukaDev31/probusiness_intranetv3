<template>
  <ConsolidadoPasosView
    :role="ROLES.COORDINACION"
    back-route="/cargaconsolidada/coordinacion/abiertos"
    base-path="/cargaconsolidada/coordinacion/abiertos"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const ConsolidadoPasosView = createLazyView(() => import('~/components/cargaconsolidada/consolidado/ConsolidadoPasosView/index.vue'))
import { ROLES } from '~/constants/roles'
</script>
