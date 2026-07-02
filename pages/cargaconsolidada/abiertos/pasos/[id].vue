<template>
  <ConsolidadoPasosView
    :role="currentRole"
    back-route="/cargaconsolidada/abiertos"
    base-path="/cargaconsolidada/abiertos"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const ConsolidadoPasosView = createLazyView(() => import('~/components/cargaconsolidada/consolidado/ConsolidadoPasosView/index.vue'))
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
