<template>
  <CargaConsolidadaCompletadosView :role="currentRole" />
</template>

<script setup lang="ts">
definePageMeta({ name: 'cargaconsolidada-completados', keepalive: true })

import CargaConsolidadaCompletadosView from '~/components/cargaconsolidada/consolidado/CargaConsolidadaCompletadosView/index.vue'
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
