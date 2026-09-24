<template>
  <CustomersView :role="currentRole || undefined" />
</template>

<script setup lang="ts">
definePageMeta({ name: 'customers', keepalive: true })

import CustomersView from '~/components/cargaconsolidada/customers/CustomersView/index.vue'
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
