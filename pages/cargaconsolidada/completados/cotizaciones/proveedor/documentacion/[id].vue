<template>
  <CotizacionesProveedorDocumentacionView :role="currentRole || undefined" />
</template>

<script setup lang="ts">
import CotizacionesProveedorDocumentacionView from '~/components/cargaconsolidada/CotizacionesProveedorDocumentacionView.vue'
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
