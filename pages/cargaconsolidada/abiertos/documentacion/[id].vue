<template>
  <ConsolidadoDocumentacionView
    :role="currentRole"
    base-path="/cargaconsolidada/abiertos"
  />
</template>

<script setup lang="ts">
import ConsolidadoDocumentacionView from '~/components/cargaconsolidada/consolidado/ConsolidadoDocumentacionView/index.vue'
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
