<template>
  <button
    type="button"
    class="block w-full min-w-0 overflow-hidden rounded-lg text-left shadow-sm ring-1 transition active:opacity-95"
    :class="
      inverted
        ? 'ring-primary-500/25'
        : 'ring-default/40 dark:ring-white/10'
    "
    @click.stop="emit('abrir')"
  >
    <div
      class="relative aspect-video w-full overflow-hidden bg-black/80"
      :class="inverted ? 'bg-primary-950/90' : 'dark:bg-[#0b141a]'"
    >
      <video
        v-if="url"
        ref="videoRef"
        :src="url"
        class="absolute inset-0 size-full object-cover"
        muted
        playsinline
        preload="metadata"
        @loadedmetadata="onLoadedMetadata"
        @error="onVideoError"
      />

      <div
        v-if="loadError"
        class="absolute inset-0 flex items-center justify-center bg-[#1f2c34]"
      >
        <UIcon name="i-heroicons-film" class="size-12 text-white/50" />
      </div>

      <div
        class="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <span
          class="flex size-12 items-center justify-center rounded-full bg-black/45 shadow-lg backdrop-blur-[2px]"
        >
          <UIcon name="i-heroicons-play-solid" class="size-7 text-white" />
        </span>
      </div>

      <div
        class="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-2 pb-1.5 pt-8"
      >
        <span
          v-if="showHd"
          class="rounded px-1 py-px text-[10px] font-semibold leading-none text-white/95 ring-1 ring-white/25"
        >
          HD
        </span>
        <span
          v-if="durationLabel"
          class="text-[12px] font-medium tabular-nums text-white"
        >
          {{ durationLabel }}
        </span>
      </div>
    </div>

    <div
      class="px-2.5 py-2"
      :class="
        inverted
          ? 'bg-primary-700/95'
          : 'bg-elevated dark:bg-[#1f2c34]'
      "
    >
      <p
        class="truncate text-[13px] leading-snug"
        :class="inverted ? 'text-white' : 'text-highlighted dark:text-white/95'"
      >
        {{ nombre }}
      </p>
    </div>

    <div
      v-if="caption?.trim()"
      class="border-t px-2.5 py-2 text-[13px] leading-snug"
      :class="
        inverted
          ? 'border-white/15 bg-black/20 text-white'
          : 'border-default/25 text-highlighted dark:border-white/10 dark:bg-[#0b141a] dark:text-white/95'
      "
    >
      <span class="block whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{{ caption }}</span>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  url: string
  nombre: string
  caption?: string | null
  inverted?: boolean
}>()

const emit = defineEmits<{
  abrir: []
  'media-ready': []
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const durationSec = ref<number | null>(null)
const showHd = ref(false)
const loadError = ref(false)

const durationLabel = computed(() => formatVideoDuration(durationSec.value))

function onLoadedMetadata() {
  const el = videoRef.value
  if (!el) return
  loadError.value = false
  if (Number.isFinite(el.duration) && el.duration > 0) {
    durationSec.value = el.duration
  }
  showHd.value = el.videoHeight >= 720 || el.videoWidth >= 1280
  emit('media-ready')
}

function onVideoError() {
  loadError.value = true
}

function formatVideoDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) {
    return ''
  }
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}
</script>
