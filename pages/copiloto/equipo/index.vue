<template>
  <div
    v-if="canAccess"
    class="flex min-h-0 flex-1 flex-col overflow-hidden max-lg:h-[calc(100dvh-4.75rem)] lg:h-[calc(100dvh-1.5rem)]"
  >
    <CopilotoJefeVentasView class="min-h-0 flex-1" />
  </div>
  <UCard v-else class="m-6 p-6 text-center">
    <p class="text-sm text-muted">Solo el jefe de ventas puede ver esta vista.</p>
    <UButton class="mt-4" to="/" color="primary" variant="soft" size="sm">Ir al inicio</UButton>
  </UCard>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { createLazyView } from '~/utils/lazyView'
import { useUserRole } from '~/composables/auth/useUserRole'
import { ID_JEFEVENTAS, ROLES } from '~/constants/roles'

definePageMeta({ layout: 'default', key: 'copiloto-equipo', name: 'copiloto-equipo-index', keepalive: true })

const CopilotoJefeVentasView = createLazyView(() => import('~/components/copiloto/CopilotoJefeVentasView/index.vue'))

const { currentId, fetchCurrentUser, hasRole } = useUserRole()

const canAccess = computed(() => {
  return Number(currentId.value) === ID_JEFEVENTAS || hasRole(ROLES.ADMIN)
})

onMounted(() => {
  fetchCurrentUser()
})
</script>
