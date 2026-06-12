<template>
  <CotizacionFinalView
    :role="currentRole || undefined"
    base-path="/cargaconsolidada/abiertos"
    back-base-path="/cargaconsolidada/abiertos"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const CotizacionFinalView = createLazyView(() => import('~/components/cargaconsolidada/cotizacion-final/CotizacionFinalView/index.vue'))
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
