<template>
  <CargaConsolidadaCompletadosView :role="currentRole" />
</template>

<script setup lang="ts">
import CargaConsolidadaCompletadosView from '~/components/cargaconsolidada/consolidado/CargaConsolidadaCompletadosView/index.vue'
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
