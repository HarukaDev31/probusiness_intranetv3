<template>
  <div
    class="flex min-h-0 w-full max-w-full flex-1 flex-col gap-5 lg:grid lg:grid-cols-3 lg:items-stretch lg:gap-4 lg:overflow-hidden"
    aria-busy="true"
    aria-label="Cargando detalle"
  >
    <div
      v-if="soloChat"
      class="flex min-h-[min(70dvh,32rem)] flex-1 flex-col"
    >
      <UCard class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div class="flex items-center gap-2 border-b border-default px-3 py-2.5 sm:px-4">
          <USkeleton class="size-8 rounded-full" />
          <div class="min-w-0 flex-1 space-y-1">
            <USkeleton class="h-3.5 w-28" />
            <USkeleton class="h-2.5 w-20" />
          </div>
        </div>
        <SoporteTiChatPanelSkeleton class="min-h-[12rem] flex-1" />
        <div class="border-t border-default px-3 py-2.5 sm:px-4">
          <USkeleton class="h-10 w-full rounded-lg" />
        </div>
      </UCard>
    </div>

    <template v-else>
      <div class="flex min-h-0 flex-col lg:col-span-2 lg:min-h-0 lg:overflow-hidden">
        <UCard class="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div class="space-y-3 border-b border-default px-3 py-2.5 sm:px-4">
            <div class="flex items-center gap-2">
              <USkeleton class="size-8 rounded-full" />
              <div class="min-w-0 flex-1 space-y-1">
                <USkeleton class="h-3.5 w-28" />
                <USkeleton class="h-2.5 w-20" />
              </div>
            </div>
            <USkeleton class="h-8 w-full rounded-lg" />
          </div>
          <SoporteTiChatPanelSkeleton class="min-h-[12rem] flex-1" />
          <div class="border-t border-default px-3 py-2.5 sm:px-4">
            <USkeleton class="h-10 w-full rounded-lg" />
          </div>
        </UCard>
      </div>

      <div class="min-w-0 space-y-5 lg:col-span-1">
        <UCard>
          <div class="mb-4 flex flex-wrap gap-2">
            <USkeleton v-for="i in 4" :key="i" class="h-5 w-16 rounded-full" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div v-for="i in 8" :key="i" class="space-y-1">
              <USkeleton class="h-2.5 w-14" />
              <USkeleton class="h-4 w-full max-w-[8rem]" />
            </div>
          </div>
        </UCard>
        <UCard>
          <USkeleton class="h-16 w-full rounded-lg" />
        </UCard>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import SoporteTiChatPanelSkeleton from '~/components/soporte-ti/SoporteTiChatPanelSkeleton.vue'

withDefaults(
  defineProps<{
    /** Vista solicitante: solo columna de chat a ancho completo */
    soloChat?: boolean
  }>(),
  { soloChat: false }
)
</script>
