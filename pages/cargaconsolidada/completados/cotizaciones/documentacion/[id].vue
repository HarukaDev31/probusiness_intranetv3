<template>
  <CotizacionesDocumentacionView
    :role="currentRole || undefined"
    base-path="/cargaconsolidada/completados"
  />
</template>

<script setup lang="ts">
import CotizacionesDocumentacionView from '~/components/cargaconsolidada/CotizacionesDocumentacionView.vue'
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
