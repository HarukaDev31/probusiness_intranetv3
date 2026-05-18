<template>
  <UModal v-model:open="abierto" :ui="{ content: 'max-w-md' }">
    <template #content>
      <div class="flex flex-col gap-4 p-5 sm:p-6">
        <div class="flex items-start gap-3">
          <div
            class="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
          >
            <UIcon name="i-heroicons-chat-bubble-left-right" class="size-6" />
          </div>
          <div class="min-w-0 flex-1">
            <p v-if="payload?.codigo" class="font-mono text-xs text-muted">{{ payload.codigo }}</p>
            <h2 class="text-base font-semibold text-highlighted">
              {{ payload?.title || 'Nuevo mensaje' }}
            </h2>
            <p class="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">
              {{ payload?.message || 'Tienes actividad nueva en el chat.' }}
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2">
          <UButton
            type="button"
            color="neutral"
            variant="outline"
            size="md"
            icon="i-heroicons-arrow-top-right-on-square"
            title="Abrir en nueva pestaña"
            aria-label="Abrir en nueva pestaña"
            @click="abrirEnNuevaPestaña"
          />
          <UButton
            type="button"
            color="primary"
            label="Ir al chat"
            icon="i-heroicons-arrow-right"
            trailing
            @click="irAlChat"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useSoporteTiChatNotificacion } from '~/composables/useSoporteTiChatNotificacion'

const { abierto, payload, cerrar, irAlChat, abrirEnNuevaPestaña } = useSoporteTiChatNotificacion()

watch(abierto, (open) => {
  if (!open) cerrar()
})
</script>
