<template>
  <CopilotoJefeVentasView v-if="canAccess" />
  <UCard v-else class="m-6 p-6 text-center">
    <p class="text-sm text-muted">Solo el jefe de ventas puede ver esta vista.</p>
    <UButton class="mt-4" to="/" color="primary" variant="soft" size="sm">Ir al inicio</UButton>
  </UCard>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import CopilotoJefeVentasView from '~/components/copiloto/CopilotoJefeVentasView/index.vue'
import { useUserRole } from '~/composables/auth/useUserRole'
import { ID_JEFEVENTAS, ROLES } from '~/constants/roles'

definePageMeta({ layout: 'default' })

const { currentId, fetchCurrentUser, hasRole } = useUserRole()

const canAccess = computed(() => {
  return Number(currentId.value) === ID_JEFEVENTAS || hasRole(ROLES.ADMIN)
})

onMounted(() => {
  fetchCurrentUser()
})
</script>
