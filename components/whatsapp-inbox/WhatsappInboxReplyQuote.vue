<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  remitente: string
  texto?: string
  imagenUrl?: string | null
  inverted?: boolean
}>()

const etiqueta = computed(() => {
  if (props.texto?.trim()) return props.texto
  if (props.imagenUrl) return 'Foto'
  return '…'
})
</script>

<template>
  <div
    class="flex min-w-0 items-stretch gap-2 overflow-hidden rounded-md px-2 py-1.5"
    :class="inverted ? 'bg-black/20' : 'bg-black/[0.06] dark:bg-black/25'"
  >
    <div
      class="min-w-0 flex-1 border-l-[3px] pl-2"
      :class="inverted ? 'border-white/80' : 'border-primary'"
    >
      <p
        class="truncate text-[11px] font-semibold leading-tight"
        :class="inverted ? 'text-white' : 'text-primary'"
      >
        {{ remitente }}
      </p>
      <p
        class="truncate text-[11px] leading-tight"
        :class="inverted ? 'text-white/80' : 'text-muted'"
      >
        {{ etiqueta }}
      </p>
    </div>
    <img
      v-if="imagenUrl"
      :src="imagenUrl"
      alt=""
      class="size-9 shrink-0 rounded object-cover ring-1 ring-default/30"
    >
  </div>
</template>
