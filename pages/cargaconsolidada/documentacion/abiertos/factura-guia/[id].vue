<template>
  <FacturaGuiaView
    :role="currentRole || undefined"
    base-path="/cargaconsolidada/documentacion/abiertos"
    back-base-path="/cargaconsolidada/documentacion/abiertos"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const FacturaGuiaView = createLazyView(() => import('~/components/cargaconsolidada/factura-guia/FacturaGuiaView/index.vue'))
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
