<template>
  <div
    class="w-full max-w-[min(100%,300px)] overflow-hidden rounded-lg text-left shadow-sm ring-1"
    :class="
      inverted
        ? 'bg-primary-700/95 ring-primary-500/30'
        : 'bg-elevated ring-default/40 dark:bg-[#1f2c34] dark:ring-white/10'
    "
  >
    <div
      class="flex items-start gap-3 px-3 pb-2 pt-2.5"
      :class="inverted ? '' : 'dark:bg-[#2a3942]'"
    >
      <div
        class="flex size-10 shrink-0 flex-col items-center justify-center rounded-sm font-bold leading-none text-white"
        :class="badgeClass"
      >
        <span class="text-[9px] tracking-wide">{{ extBadge }}</span>
      </div>
      <div class="min-w-0 flex-1 pt-0.5">
        <p
          class="truncate text-[15px] font-medium leading-tight"
          :class="inverted ? 'text-white' : 'text-highlighted dark:text-white'"
        >
          {{ nombre }}
        </p>
        <p
          v-if="metaLine"
          class="mt-0.5 truncate text-[12px]"
          :class="inverted ? 'text-white/70' : 'text-muted dark:text-white/60'"
        >
          {{ metaLine }}
        </p>
      </div>
      <span
        v-if="timeLabel"
        class="shrink-0 pt-1 text-[11px] leading-none"
        :class="inverted ? 'text-white/65' : 'text-muted dark:text-white/55'"
      >
        {{ timeLabel }}
      </span>
    </div>

    <div
      class="flex items-stretch border-t text-center text-sm font-medium"
      :class="inverted ? 'border-white/15' : 'border-default/25 dark:border-white/10'"
    >
      <button
        type="button"
        class="wa-inbox-doc-action flex-1 py-2.5 transition hover:underline"
        @click.stop="emit('abrir')"
      >
        Abrir
      </button>
      <span
        class="w-px self-stretch"
        :class="inverted ? 'bg-white/15' : 'bg-default/25 dark:bg-white/10'"
        aria-hidden="true"
      />
      <button
        type="button"
        class="wa-inbox-doc-action flex-1 py-2.5 transition hover:underline"
        @click.stop="onGuardar"
      >
        Guardar como…
      </button>
    </div>

    <div
      v-if="caption?.trim()"
      class="border-t px-3 py-2.5 text-[14px] leading-snug"
      :class="
        inverted
          ? 'border-white/15 bg-black/20 text-white'
          : 'border-default/25 bg-muted/70 text-highlighted dark:border-white/10 dark:bg-[#0b141a] dark:text-white/95'
      "
    >
      <span class="block whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{{ caption }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { extensionAdjunto } from '~/utils/soporteTiChatAdjunto'

const props = defineProps<{
  url: string
  nombre: string
  caption?: string | null
  timeLabel?: string | null
  sizeBytes?: number | null
  inverted?: boolean
}>()

const emit = defineEmits<{
  abrir: []
  guardar: []
}>()

const ext = computed(() => extensionAdjunto(props.nombre))

const metaLine = computed(() => {
  const label = extBadge.value
  const size = props.sizeBytes
  if (size && size > 0) {
    const kb = size / 1024
    const sizeLabel = kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} kB`
    return `${label} • ${sizeLabel}`
  }
  return label || null
})

const extBadge = computed(() => {
  const e = ext.value.toUpperCase()
  if (e.length <= 4) return e
  return e.slice(0, 4)
})

const badgeClass = computed(() => {
  const e = ext.value.toLowerCase()
  if (e === 'pdf') return 'bg-red-600'
  if (['doc', 'docx'].includes(e)) return 'bg-blue-600'
  if (['xls', 'xlsx', 'csv'].includes(e)) return 'bg-emerald-700'
  if (['ppt', 'pptx'].includes(e)) return 'bg-orange-600'
  return 'bg-zinc-600'
})

function onGuardar() {
  emit('guardar')
  if (!props.url) return
  const a = document.createElement('a')
  a.href = props.url
  a.download = props.nombre || 'documento'
  a.rel = 'noopener'
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
</script>

<style scoped>
.wa-inbox-doc-action {
  color: #00a884;
}
.dark .wa-inbox-doc-action {
  color: #53bdeb;
}
</style>
