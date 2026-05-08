<template>
  <ClientesView
    :role="currentRole || undefined"
    base-path="/cargaconsolidada/documentacion/completados"
    back-base-path="/cargaconsolidada/documentacion/completados"
  />
</template>

<script setup lang="ts">
import ClientesView from '~/components/cargaconsolidada/clientes/ClientesView/index.vue'
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
