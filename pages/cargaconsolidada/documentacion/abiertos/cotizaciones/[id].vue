<template>
  <DocumentacionCotizacionesView
    :role="ROLES.DOCUMENTACION"
    base-path="/cargaconsolidada/documentacion/abiertos"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const DocumentacionCotizacionesView = createLazyView(() => import('~/components/cargaconsolidada/cotizaciones/DocumentacionCotizacionesView/index.vue'))
import { ROLES } from '~/constants/roles'
</script>
