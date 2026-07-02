<template>
  <CotizacionesProveedorDocumentacionView :role="currentRole || undefined" />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const CotizacionesProveedorDocumentacionView = createLazyView(() => import('~/components/cargaconsolidada/cotizaciones/CotizacionesProveedorDocumentacionView/index.vue'))
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
