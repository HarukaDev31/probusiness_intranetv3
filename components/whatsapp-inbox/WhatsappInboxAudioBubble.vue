<template>
  <div
    class="wa-audio-bubble w-[min(100%,280px)] min-w-[220px] overflow-hidden rounded-lg shadow-sm ring-1"
    :class="bubbleClass"
  >
    <div class="flex items-center gap-2 px-2 py-2">
      <div class="relative shrink-0">
        <UAvatar
          :text="avatarText || '?'"
          size="md"
          :ui="{
            root: inverted ? 'ring-1 ring-white/20' : 'ring-1 ring-default/30',
            fallback: inverted
              ? 'bg-[#0b3d32] text-white font-bold'
              : 'bg-elevated text-primary font-bold'
          }"
        />
        <span
          class="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[#00a884] ring-2"
          :class="inverted ? 'ring-[#005c4b] dark:ring-[#005c4b]' : 'ring-white dark:ring-[#202c33]'"
          aria-hidden="true"
        >
          <UIcon name="i-heroicons-microphone" class="size-2.5 text-white" />
        </span>
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            class="flex size-8 shrink-0 items-center justify-center rounded-full transition hover:bg-black/5 dark:hover:bg-white/10"
            :disabled="!url || loadError"
            :aria-label="playing ? 'Pausar' : 'Reproducir'"
            @click.stop="togglePlay"
          >
            <UIcon
              :name="playing ? 'i-heroicons-pause-solid' : 'i-heroicons-play-solid'"
              class="size-5"
              :class="iconClass"
            />
          </button>

          <div
            ref="waveformRef"
            class="relative flex h-7 min-w-0 flex-1 cursor-pointer items-center gap-[2px] px-0.5"
            role="slider"
            :aria-valuenow="Math.round(progress * 100)"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="durationLabel || 'Progreso del audio'"
            @click.stop="onWaveformClick"
          >
            <span
              v-for="(height, index) in waveformBars"
              :key="index"
              class="w-[2px] shrink-0 rounded-full transition-colors duration-150"
              :class="barClass(index)"
              :style="{ height: `${height}%` }"
            />
            <span
              v-if="url && !loadError"
              class="pointer-events-none absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-[#53bdeb] shadow-sm ring-2 ring-white/80 dark:ring-[#005c4b]/60"
              :style="{ left: `calc(${progress * 100}% - 6px)` }"
            />
          </div>
        </div>

        <div class="mt-0.5 flex items-center justify-between gap-2 pl-9 pr-0.5">
          <span class="text-[11px] tabular-nums" :class="metaClass">
            {{ displayTime }}
          </span>
          <span v-if="timeLabel" class="flex shrink-0 items-center gap-0.5 text-[11px]" :class="metaClass">
            <span>{{ timeLabel }}</span>
            <span
              v-if="deliveryIcon"
              class="select-none text-[13px] font-bold leading-none tracking-tighter"
              :class="deliveryClass"
            >
              {{ deliveryIcon }}
            </span>
          </span>
        </div>
      </div>
    </div>

    <audio
      v-if="url"
      ref="audioRef"
      :src="url"
      preload="metadata"
      class="hidden"
      @loadedmetadata="onLoadedMetadata"
      @timeupdate="onTimeUpdate"
      @ended="onEnded"
      @error="onAudioError"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const WA_AUDIO_STOP_EVENT = 'wa-inbox-audio-stop'

const props = defineProps<{
  url: string
  inverted?: boolean
  avatarText?: string
  timeLabel?: string
  deliveryIcon?: string
  deliveryClass?: string
}>()

const emit = defineEmits<{
  'media-ready': []
}>()

const audioRef = ref<HTMLAudioElement | null>(null)
const waveformRef = ref<HTMLElement | null>(null)
const playing = ref(false)
const progress = ref(0)
const durationSec = ref<number | null>(null)
const currentSec = ref(0)
const loadError = ref(false)
const playerId = `wa-audio-${Math.random().toString(36).slice(2, 10)}`

const waveformBars = computed(() => generateWaveformBars(props.url || 'placeholder', 48))

const bubbleClass = computed(() =>
  props.inverted
    ? 'bg-[#d9fdd3] ring-[#c5e8bc]/80 text-[#111b21] dark:bg-[#005c4b] dark:ring-[#004d40]/60 dark:text-white'
    : 'bg-white ring-default/40 text-[#111b21] dark:bg-[#202c33] dark:ring-white/10 dark:text-white'
)

const iconClass = computed(() =>
  props.inverted
    ? 'text-[#111b21] dark:text-white'
    : 'text-[#54656f] dark:text-white/90'
)

const metaClass = computed(() =>
  props.inverted
    ? 'text-[#667781] dark:text-white/65'
    : 'text-[#667781] dark:text-white/55'
)

const durationLabel = computed(() => formatAudioDuration(durationSec.value))

const displayTime = computed(() => {
  if (playing.value || currentSec.value > 0) {
    return formatAudioDuration(currentSec.value)
  }
  return durationLabel.value || '0:00'
})

function barClass(index: number) {
  const playedRatio = progress.value
  const barRatio = (index + 1) / waveformBars.value.length
  const isPlayed = barRatio <= playedRatio

  if (props.inverted) {
    return isPlayed
      ? 'bg-[#4a7c6f] dark:bg-[#b8e0d4]'
      : 'bg-[#4a7c6f]/35 dark:bg-[#72af9e]/45'
  }
  return isPlayed
    ? 'bg-[#8696a0] dark:bg-[#aebac1]'
    : 'bg-[#8696a0]/35 dark:bg-[#8696a0]/40'
}

function generateWaveformBars(seed: string, count: number): number[] {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  const bars: number[] = []
  for (let i = 0; i < count; i++) {
    hash = (hash * 1103515245 + 12345 + i) | 0
    const normalized = Math.abs(hash % 100) / 100
    bars.push(28 + normalized * 72)
  }
  return bars
}

function formatAudioDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function onLoadedMetadata() {
  const el = audioRef.value
  if (!el) return
  loadError.value = false
  if (Number.isFinite(el.duration) && el.duration > 0) {
    durationSec.value = el.duration
  }
  emit('media-ready')
}

function onTimeUpdate() {
  const el = audioRef.value
  if (!el || !Number.isFinite(el.duration) || el.duration <= 0) return
  currentSec.value = el.currentTime
  progress.value = Math.min(1, el.currentTime / el.duration)
}

function onEnded() {
  playing.value = false
  progress.value = 0
  currentSec.value = 0
  const el = audioRef.value
  if (el) el.currentTime = 0
}

function onAudioError() {
  loadError.value = true
  playing.value = false
}

function stopPlayback() {
  const el = audioRef.value
  if (el) {
    el.pause()
    el.currentTime = 0
  }
  playing.value = false
  progress.value = 0
  currentSec.value = 0
}

function onExternalStop(e: Event) {
  const detail = (e as CustomEvent<{ except?: string }>).detail
  if (detail?.except !== playerId) stopPlayback()
}

async function togglePlay() {
  const el = audioRef.value
  if (!el || !props.url || loadError.value) return

  if (playing.value) {
    el.pause()
    playing.value = false
    return
  }

  window.dispatchEvent(
    new CustomEvent(WA_AUDIO_STOP_EVENT, { detail: { except: playerId } })
  )

  try {
    await el.play()
    playing.value = true
  } catch {
    playing.value = false
  }
}

function onWaveformClick(e: MouseEvent) {
  const el = audioRef.value
  const container = waveformRef.value
  if (!el || !container || !props.url || loadError.value) return

  const rect = container.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))

  if (Number.isFinite(el.duration) && el.duration > 0) {
    el.currentTime = ratio * el.duration
    currentSec.value = el.currentTime
    progress.value = ratio
  }
}

watch(
  () => props.url,
  () => {
    stopPlayback()
    durationSec.value = null
    loadError.value = false
  }
)

onMounted(() => {
  window.addEventListener(WA_AUDIO_STOP_EVENT, onExternalStop)
})

onBeforeUnmount(() => {
  window.removeEventListener(WA_AUDIO_STOP_EVENT, onExternalStop)
  stopPlayback()
})
</script>
