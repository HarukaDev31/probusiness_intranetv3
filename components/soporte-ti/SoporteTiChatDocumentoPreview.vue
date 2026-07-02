<template>
  <div class="flex min-h-0 flex-1 flex-col bg-neutral-950">
    <p class="shrink-0 truncate px-4 py-3 text-center text-sm text-white/90">
      {{ nombre }}
    </p>
    <div class="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-8">
      <div
        class="flex w-full max-w-lg flex-col items-center justify-center rounded-2xl px-6 py-14 sm:py-16"
        style="background-color: #182229"
      >
        <UIcon name="i-heroicons-document-text" class="mb-8 size-28 text-white/85" />
        <p class="text-center text-lg font-normal text-white/90">
          No hay vista previa disponible
        </p>
        <p class="mt-3 text-center text-sm text-white/45">
          {{ tamano }} · {{ extension }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { tamanoAdjuntoLegible, extensionAdjunto } from '~/utils/soporteTiChatAdjunto'

const props = defineProps<{
  nombre: string
  tamanoBytes: number
}>()

const tamano = computed(() => tamanoAdjuntoLegible(props.tamanoBytes))
const extension = computed(() => extensionAdjunto(props.nombre))
</script>
