<template>
  <CustomersView :role="currentRole || undefined" />
</template>

<script setup lang="ts">
definePageMeta({ name: 'cargaconsolidada-customers', keepalive: true })

import { createLazyView } from '~/utils/lazyView'
import { useUserRole } from '~/composables/auth/useUserRole'

const CustomersView = createLazyView(() => import('~/components/cargaconsolidada/customers/CustomersView/index.vue'))

const { currentRole } = useUserRole()
</script>
