<template>
  <EntregaView
    :role="currentRole || undefined"
    base-path="/cargaconsolidada/documentacion/abiertos"
    back-base-path="/cargaconsolidada/documentacion/abiertos"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useUserRole } from '~/composables/auth/useUserRole'

const EntregaView = defineAsyncComponent(
  () => import('~/components/cargaconsolidada/entrega/EntregaView/index.vue')
)
const { currentRole } = useUserRole()
</script>
