<template>
  <ConsolidadoPasosView
    :role="currentRole"
    back-route="/cargaconsolidada/abiertos"
    base-path="/cargaconsolidada/abiertos"
  />
</template>

<script setup lang="ts">
import ConsolidadoPasosView from '~/components/cargaconsolidada/ConsolidadoPasosView.vue'
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
