<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  remitente: string
  texto?: string
  imagenUrl?: string | null
  /** Burbuja propia (fondo primary) */
  inverted?: boolean
}>()

const etiqueta = computed(() => {
  if (props.texto?.trim()) return props.texto
  if (props.imagenUrl) return 'Foto'
  return ''
})

const rootClass = computed(() =>
  props.inverted
    ? 'bg-inverted/15 ring-1 ring-inverted/25'
    : 'bg-muted/60 ring-1 ring-default'
)
</script>

<template>
  <div
    class="flex items-center gap-2 overflow-hidden rounded-lg p-2"
    :class="rootClass"
  >
    <div
      class="min-w-0 flex-1 border-l-2 pl-2"
      :class="inverted ? 'border-inverted/50' : 'border-primary'"
    >
      <p
        class="truncate text-[10px] font-semibold"
        :class="inverted ? 'text-inverted' : 'text-primary'"
      >
        {{ remitente }}
      </p>
      <p
        v-if="etiqueta"
        class="truncate text-[10px]"
        :class="inverted ? 'text-inverted/75' : 'text-muted'"
      >
        {{ etiqueta }}
      </p>
    </div>
    <img
      v-if="imagenUrl"
      :src="imagenUrl"
      alt=""
      class="size-11 shrink-0 rounded-md object-cover ring-1 ring-default"
    >
  </div>
</template>
