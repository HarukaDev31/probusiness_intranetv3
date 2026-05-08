<template>
  <CotizacionesDocumentacionView
    :role="currentRole || undefined"
    base-path="/cargaconsolidada/abiertos"
  />
</template>

<script setup lang="ts">
import CotizacionesDocumentacionView from '~/components/cargaconsolidada/cotizaciones/CotizacionesDocumentacionView/index.vue'
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
