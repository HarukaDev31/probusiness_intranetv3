<template>
  <CotizacionesView
    :role="currentRole || undefined"
    base-path="/cargaconsolidada/documentacion/completados"
    back-base-path="/cargaconsolidada/documentacion/completados"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const CotizacionesView = createLazyView(() => import('~/components/cargaconsolidada/cotizaciones/CotizacionesView/index.vue'))
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
