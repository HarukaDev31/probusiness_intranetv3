<template>
  <EntregaView
    :role="currentRole || undefined"
    base-path="/cargaconsolidada/completados"
    back-base-path="/cargaconsolidada/completados"
  />
</template>

<script setup lang="ts">
import EntregaView from '~/components/cargaconsolidada/entrega/EntregaView/index.vue'
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
