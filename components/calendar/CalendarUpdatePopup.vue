<template>
  <UModal
    :open="showCalendarUpdatePopup"
    @close="dismiss"
  >
    <template #content>
      <div class="p-4 sm:p-6">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 rounded-full bg-primary-100 dark:bg-primary-900/30 p-2">
            <UIcon name="i-heroicons-calendar-days" class="text-primary-600 dark:text-primary-400 size-5" />
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              Calendario actualizado
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Hay cambios recientes en el calendario. Recarga la vista para verlos.
            </p>
            <div class="mt-4 flex flex-wrap gap-2">
              <UButton
                color="primary"
                label="Recargar vista actual"
                icon="i-heroicons-arrow-path"
                @click="reloadCurrentView"
              />
              <UButton
                variant="ghost"
                label="Cerrar"
                @click="dismiss"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useCalendarUpdateNotification } from '~/composables/useCalendarUpdateNotification'

const {
  showCalendarUpdatePopup,
  dismiss,
  reloadCurrentView
} = useCalendarUpdateNotification()
</script>
