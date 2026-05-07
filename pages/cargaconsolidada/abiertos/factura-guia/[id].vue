<template>
  <FacturaGuiaView
    :role="currentRole || undefined"
    base-path="/cargaconsolidada/abiertos"
    back-base-path="/cargaconsolidada/abiertos"
  />
</template>

<script setup lang="ts">
import FacturaGuiaView from '~/components/cargaconsolidada/factura-guia/FacturaGuiaView/index.vue'
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
