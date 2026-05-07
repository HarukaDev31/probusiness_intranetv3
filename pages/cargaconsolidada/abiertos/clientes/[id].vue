<template>
  <ClientesView
    :role="currentRole || undefined"
    base-path="/cargaconsolidada/abiertos"
    back-base-path="/cargaconsolidada/abiertos"
  />
</template>

<script setup lang="ts">
import ClientesView from '~/components/cargaconsolidada/clientes/ClientesView/index.vue'
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
