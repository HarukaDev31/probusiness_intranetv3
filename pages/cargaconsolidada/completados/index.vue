<template>
  <CargaConsolidadaCompletadosView :role="currentRole" />
</template>

<script setup lang="ts">
definePageMeta({ name: 'cargaconsolidada-completados', keepalive: true })

import { createLazyView } from '~/utils/lazyView'

const CargaConsolidadaCompletadosView = createLazyView(() => import('~/components/cargaconsolidada/consolidado/CargaConsolidadaCompletadosView/index.vue'))
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
