<template>
  <DocumentacionCotizacionesView
    :role="ROLES.DOCUMENTACION"
    base-path="/cargaconsolidada/documentacion/abiertos"
  />
</template>

<script setup lang="ts">
import DocumentacionCotizacionesView from '~/components/cargaconsolidada/cotizaciones/DocumentacionCotizacionesView/index.vue'
import { ROLES } from '~/constants/roles'
</script>
