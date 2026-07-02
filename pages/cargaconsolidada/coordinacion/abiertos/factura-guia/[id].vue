<template>
  <FacturaGuiaView
    :role="ROLES.COORDINACION"
    base-path="/cargaconsolidada/coordinacion/abiertos"
    back-base-path="/cargaconsolidada/coordinacion/abiertos"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const FacturaGuiaView = createLazyView(() => import('~/components/cargaconsolidada/factura-guia/FacturaGuiaView/index.vue'))
import { ROLES } from '~/constants/roles'
</script>
