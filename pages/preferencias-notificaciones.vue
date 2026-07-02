<template>
  <div class="p-6 max-w-3xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Preferencias de avisos
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        Elige qué avisos quieres recibir en el momento. Tu historial en la campana no cambia.
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div
        v-for="n in 3"
        :key="n"
        class="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
      />
    </div>

    <!-- Sin eventos asociados al rol -->
    <div
      v-else-if="!hasAvailableTypes"
      class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
    >
      <UIcon name="i-heroicons-bell-slash" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
      <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-1">
        Sin avisos configurables
      </h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
        Tu perfil no tiene avisos en tiempo real asociados. Si cambias de rol o te habilitan nuevos módulos, aparecerán aquí.
      </p>
    </div>

    <!-- Contenido -->
    <div v-else class="space-y-6">
      <div
        v-for="(types, modulo) in groupedTypes"
        :key="modulo"
        class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
          <h2 class="font-semibold text-gray-900 dark:text-white">{{ modulo }}</h2>
        </div>

        <div class="divide-y divide-gray-100 dark:divide-gray-700">
          <div
            v-for="type in types"
            :key="type.key"
            class="px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
          >
            <!-- Descripción del aviso -->
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <p class="font-medium text-gray-900 dark:text-white">{{ type.label }}</p>
                <UBadge
                  v-if="!type.silenciable"
                  color="neutral"
                  variant="soft"
                  size="xs"
                  icon="i-heroicons-lock-closed"
                >
                  Obligatorio
                </UBadge>
              </div>
              <p v-if="type.descripcion" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ type.descripcion }}
              </p>
            </div>

            <!-- Toggles por canal -->
            <div class="flex flex-wrap gap-4 sm:justify-end shrink-0">
              <div
                v-for="canal in type.canales"
                :key="canal"
                class="flex items-center gap-2"
              >
                <USwitch
                  :model-value="isEnabled(type.key, canal)"
                  :disabled="!type.silenciable || saving"
                  @update:model-value="(value: boolean) => onToggle(type.key, canal, value)"
                />
                <span class="text-sm text-gray-600 dark:text-gray-300">
                  {{ canalLabel(canal) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  useNotificationPreferences,
  WS_NOTIFICATION_CHANNELS,
  type WsNotificationChannel,
} from '~/composables/notifications/preferences'
import { useModal } from '~/composables/commons/useModal'

definePageMeta({
  title: 'Preferencias de avisos',
  layout: 'default',
})

const { showError } = useModal()
const {
  loading,
  saving,
  groupedTypes,
  hasAvailableTypes,
  isEnabled,
  setEnabled,
  load,
  fetchCurrentUser,
} = useNotificationPreferences()

const canalLabel = (canal: WsNotificationChannel): string =>
  WS_NOTIFICATION_CHANNELS.find(c => c.value === canal)?.label || canal

const onToggle = async (key: string, canal: WsNotificationChannel, value: boolean) => {
  try {
    await setEnabled(key, canal, value)
  } catch (error) {
    showError('No se pudo guardar', 'No se pudo actualizar la preferencia. Intenta nuevamente.')
  }
}

onMounted(() => {
  fetchCurrentUser()
  load()
})
</script>
