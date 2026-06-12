<template>
  <ClientesDocumentacionView
    :role="currentRole || undefined"
    base-path="/cargaconsolidada/abiertos"
    back-base-path="/cargaconsolidada/abiertos"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const ClientesDocumentacionView = createLazyView(() => import('~/components/cargaconsolidada/clientes/ClientesDocumentacionView/index.vue'))
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
