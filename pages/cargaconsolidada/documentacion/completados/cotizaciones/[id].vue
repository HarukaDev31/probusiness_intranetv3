<template>
  <DocumentacionCotizacionesView
    :role="ROLES.DOCUMENTACION"
    base-path="/cargaconsolidada/documentacion/completados"
  />
</template>

<script setup lang="ts">
import DocumentacionCotizacionesView from '~/components/cargaconsolidada/DocumentacionCotizacionesView.vue'
import { ROLES } from '~/constants/roles'
</script>
