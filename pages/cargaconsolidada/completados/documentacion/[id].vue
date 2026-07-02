<template>
  <ConsolidadoDocumentacionView
    :role="currentRole"
    base-path="/cargaconsolidada/completados"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const ConsolidadoDocumentacionView = createLazyView(() => import('~/components/cargaconsolidada/consolidado/ConsolidadoDocumentacionView/index.vue'))
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
