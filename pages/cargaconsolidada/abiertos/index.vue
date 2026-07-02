<template>
  <CargaConsolidadaAbiertaView :role="currentRole" />
</template>

<script setup lang="ts">
definePageMeta({ name: 'cargaconsolidada-abiertos', keepalive: true })

import { createLazyView } from '~/utils/lazyView'

const CargaConsolidadaAbiertaView = createLazyView(() => import('~/components/cargaconsolidada/consolidado/CargaConsolidadaAbiertaView/index.vue'))
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
