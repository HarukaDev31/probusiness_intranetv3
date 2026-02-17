<template>
  <ConsolidadoDocumentacionView
    :role="currentRole"
    base-path="/cargaconsolidada/completados"
  />
</template>

<script setup lang="ts">
import ConsolidadoDocumentacionView from '~/components/cargaconsolidada/ConsolidadoDocumentacionView.vue'
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
