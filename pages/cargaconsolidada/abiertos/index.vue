<template>
  <CargaConsolidadaAbiertaView :role="currentRole" />
</template>

<script setup lang="ts">
import CargaConsolidadaAbiertaView from '~/components/cargaconsolidada/consolidado/CargaConsolidadaAbiertaView/index.vue'
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
