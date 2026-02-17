<template>
  <CargaConsolidadaCompletadosView :role="currentRole" />
</template>

<script setup lang="ts">
import CargaConsolidadaCompletadosView from '~/components/cargaconsolidada/CargaConsolidadaCompletadosView.vue'
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
