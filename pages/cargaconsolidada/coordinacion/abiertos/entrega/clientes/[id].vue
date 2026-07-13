<template>
  <EntregaClientesView
    :role="currentRole || undefined"
    base-path="/cargaconsolidada/coordinacion/abiertos"
    back-base-path="/cargaconsolidada/coordinacion/abiertos"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useUserRole } from '~/composables/auth/useUserRole'

const EntregaClientesView = defineAsyncComponent(
  () => import('~/components/cargaconsolidada/entrega/EntregaClientesView/index.vue')
)
const { currentRole } = useUserRole()
</script>
