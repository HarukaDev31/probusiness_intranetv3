<template>
  <button
    type="button"
    class="block w-full text-left transition hover:opacity-90"
    :class="soloDocumento ? 'px-2 pb-1 pt-0' : 'overflow-hidden rounded-lg ring-1 ring-default/40'"
    :title="nombre"
    @click.stop="emit('abrir', url, nombre)"
  >
    <img
      v-if="mostrarComoImagen"
      :src="url"
      :alt="nombre"
      class="max-h-48 w-full object-cover"
      loading="lazy"
      @error="imagenFallida = true"
    >
    <div
      v-else
      class="flex min-w-[200px] max-w-full items-center gap-3 rounded-lg px-2.5 py-2"
      :class="inverted ? 'bg-black/15' : 'bg-elevated/80 ring-1 ring-default/50'"
    >
      <div
        class="relative flex size-11 shrink-0 flex-col items-center justify-center rounded-md"
        :class="inverted ? 'bg-white/20' : 'bg-muted'"
      >
        <UIcon
          name="i-heroicons-document-text"
          class="size-7"
          :class="inverted ? 'text-inverted/90' : 'text-muted'"
        />
        <span
          class="absolute bottom-0.5 max-w-[2.5rem] truncate text-[8px] font-bold leading-none"
          :class="inverted ? 'text-inverted' : 'text-highlighted'"
        >
          {{ extension }}
        </span>
      </div>
      <div class="min-w-0 flex-1">
        <p
          class="truncate text-[13px] font-medium leading-tight"
          :class="inverted ? 'text-inverted' : 'text-highlighted'"
        >
          {{ nombre }}
        </p>
        <p
          class="mt-0.5 text-[11px] leading-tight"
          :class="inverted ? 'text-inverted/70' : 'text-muted'"
        >
          {{ extension }} · {{ tamanoTexto }}
        </p>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  extensionAdjunto,
  esImagenInlineAdjunto,
  tamanoAdjuntoDesdeApi,
  tamanoAdjuntoLegible
} from '~/utils/soporteTiChatAdjunto'

const props = defineProps<{
  url: string
  nombre: string
  tamano?: string | null
  inverted?: boolean
  forzarDocumento?: boolean
}>()

const emit = defineEmits<{
  abrir: [url: string, nombre: string]
}>()

const imagenFallida = ref(false)

const extension = computed(() => extensionAdjunto(props.nombre))
const tamanoTexto = computed(() => {
  const bytes = tamanoAdjuntoDesdeApi(props.tamano)
  return bytes > 0 ? tamanoAdjuntoLegible(bytes) : '—'
})

const soloDocumento = computed(
  () => props.forzarDocumento || !esImagenInlineAdjunto(props.nombre) || imagenFallida.value
)

const mostrarComoImagen = computed(() => !soloDocumento.value)
</script>
