<template>
  <CotizacionesDocumentacionView
    :role="currentRole || undefined"
    base-path="/cargaconsolidada/coordinacion/completados"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const CotizacionesDocumentacionView = createLazyView(() => import('~/components/cargaconsolidada/cotizaciones/CotizacionesDocumentacionView/index.vue'))
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
