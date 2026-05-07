<template>
  <EntregaClientesView
    :role="currentRole || undefined"
    base-path="/cargaconsolidada/completados"
    back-base-path="/cargaconsolidada/completados"
  />
</template>

<script setup lang="ts">
import EntregaClientesView from '~/components/cargaconsolidada/entrega/EntregaClientesView/index.vue'
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
