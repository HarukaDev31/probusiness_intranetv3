<template>
  <div
    v-if="canAccess"
    class="flex min-h-0 flex-1 flex-col overflow-hidden max-lg:h-[calc(100dvh-4.75rem)] lg:h-[calc(100dvh-1.5rem)]"
  >
    <CopilotoCotizadorView class="min-h-0 flex-1" />
  </div>
  <UCard v-else class="m-6 p-6 text-center">
    <p class="text-sm text-muted">No tienes acceso a Copiloto IA.</p>
    <UButton class="mt-4" to="/" color="primary" variant="soft" size="sm">Ir al inicio</UButton>
  </UCard>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { navigateTo } from '#imports'
import { createLazyView } from '~/utils/lazyView'
import { useUserRole } from '~/composables/auth/useUserRole'
import { ROLES, ID_JEFEVENTAS } from '~/constants/roles'

definePageMeta({ layout: 'default', key: 'copiloto-advisor', name: 'copiloto-index', keepalive: true })

const CopilotoCotizadorView = createLazyView(() => import('~/components/copiloto/CopilotoCotizadorView/index.vue'))

const { hasRole, currentId, fetchCurrentUser, isCotizador } = useUserRole()

const isJefeVentasOEquivalente = computed(() => Number(currentId.value) === ID_JEFEVENTAS || hasRole(ROLES.RRHH))

const canAccess = computed(() => {
  if (isCotizador.value) return true
  if (isJefeVentasOEquivalente.value) return true
  return hasRole(ROLES.ADMIN)
})

onMounted(async () => {
  await fetchCurrentUser()
  if (isJefeVentasOEquivalente.value) {
    await navigateTo('/copiloto/equipo', { replace: true })
  }
})
</script>
