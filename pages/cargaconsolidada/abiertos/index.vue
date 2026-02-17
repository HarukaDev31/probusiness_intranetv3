<template>
  <CargaConsolidadaAbiertaView :role="currentRole" />
</template>

<script setup lang="ts">
import CargaConsolidadaAbiertaView from '~/components/cargaconsolidada/CargaConsolidadaAbiertaView.vue'
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
