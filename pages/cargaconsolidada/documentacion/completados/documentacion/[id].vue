<template>
  <ConsolidadoDocumentacionView
    :role="ROLES.DOCUMENTACION"
    base-path="/cargaconsolidada/documentacion/completados"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const ConsolidadoDocumentacionView = createLazyView(() => import('~/components/cargaconsolidada/consolidado/ConsolidadoDocumentacionView/index.vue'))
import { ROLES } from '~/constants/roles'
</script>
