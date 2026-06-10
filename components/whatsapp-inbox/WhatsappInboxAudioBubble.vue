<template>
  <div
    class="wa-audio-bubble w-[min(100%,280px)] min-w-[220px] overflow-hidden rounded-lg shadow-sm ring-1"
    :class="bubbleClass"
  >
    <div class="flex items-center gap-2 px-2 py-2">
      <div class="relative shrink-0">
        <button
          v-if="playing"
          type="button"
          class="flex size-10 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums transition hover:bg-black/5 dark:hover:bg-white/10"
          :class="speedBtnClass"
          :aria-label="`Velocidad ${speedLabel}. Toca para cambiar`"
          @click.stop="cycleSpeed"
        >
          {{ speedLabel }}
        </button>
        <template v-else>
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
        </template>
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
            class="relative flex h-8 min-w-0 flex-1 cursor-pointer select-none items-center px-0.5 touch-none"
            role="slider"
            :aria-valuenow="Math.round(displayProgress * 100)"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="durationLabel || 'Progreso del audio'"
            @pointerdown.stop="onWaveformPointerDown"
          >
            <div class="flex h-[18px] w-full items-end gap-[2px]">
              <span
                v-for="(height, index) in waveformBars"
                :key="index"
                class="pointer-events-none w-[2px] shrink-0 rounded-full"
                :class="barClass(index)"
                :style="{ height: `${height}%` }"
              />
            </div>
            <span
              v-if="url && !loadError"
              class="pointer-events-auto absolute z-10 flex size-5 items-center justify-center"
              :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
              :style="scrubberStyle"
              @pointerdown.stop="onScrubberPointerDown"
            >
              <span
                class="block size-3 shrink-0 rounded-full bg-[#53bdeb] shadow-sm ring-2 ring-white/80 dark:ring-[#005c4b]/60"
              />
            </span>
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
      @ended="onEnded"
      @error="onAudioError"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const WA_AUDIO_STOP_EVENT = 'wa-inbox-audio-stop'
const PLAYBACK_SPEEDS = [1, 1.5, 2] as const

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
const isDragging = ref(false)
const speedIndex = ref(0)
const playerId = `wa-audio-${Math.random().toString(36).slice(2, 10)}`

let rafId: number | null = null
let activePointerId: number | null = null

const waveformBars = computed(() => generateWaveformBars(props.url || 'placeholder', 48))

const playbackRate = computed(() => PLAYBACK_SPEEDS[speedIndex.value])

const speedLabel = computed(() => {
  const rate = PLAYBACK_SPEEDS[speedIndex.value]
  return rate === 1 ? '1×' : `${rate}×`
})

const displayProgress = computed(() => progress.value)

const scrubberStyle = computed(() => ({
  left: `${displayProgress.value * 100}%`,
  top: '50%',
  transform: 'translate(-50%, -50%)',
  willChange: playing.value || isDragging.value ? 'left' : 'auto'
}))

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

const speedBtnClass = computed(() =>
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
  if (playing.value || currentSec.value > 0 || isDragging.value) {
    return formatAudioDuration(currentSec.value)
  }
  return durationLabel.value || '0:00'
})

function barClass(index: number) {
  const playedRatio = displayProgress.value
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

function applyPlaybackRate() {
  const el = audioRef.value
  if (el) el.playbackRate = playbackRate.value
}

function syncProgressFromAudio() {
  const el = audioRef.value
  if (!el || !Number.isFinite(el.duration) || el.duration <= 0) return
  currentSec.value = el.currentTime
  progress.value = Math.min(1, el.currentTime / el.duration)
}

function startProgressLoop() {
  stopProgressLoop()
  const tick = () => {
    if (!playing.value || isDragging.value) {
      rafId = null
      return
    }
    syncProgressFromAudio()
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
}

function stopProgressLoop() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function ratioFromClientX(clientX: number): number {
  const container = waveformRef.value
  if (!container) return 0
  const rect = container.getBoundingClientRect()
  if (rect.width <= 0) return 0
  return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
}

function seekToRatio(ratio: number) {
  const el = audioRef.value
  if (!el || !Number.isFinite(el.duration) || el.duration <= 0) return
  const nextTime = ratio * el.duration
  el.currentTime = nextTime
  currentSec.value = nextTime
  progress.value = ratio
}

function onLoadedMetadata() {
  const el = audioRef.value
  if (!el) return
  loadError.value = false
  if (Number.isFinite(el.duration) && el.duration > 0) {
    durationSec.value = el.duration
  }
  applyPlaybackRate()
  emit('media-ready')
}

function onEnded() {
  playing.value = false
  stopProgressLoop()
  progress.value = 0
  currentSec.value = 0
  speedIndex.value = 0
  const el = audioRef.value
  if (el) {
    el.currentTime = 0
    el.playbackRate = 1
  }
}

function onAudioError() {
  loadError.value = true
  playing.value = false
  stopProgressLoop()
}

function stopPlayback() {
  const el = audioRef.value
  if (el) {
    el.pause()
    el.currentTime = 0
    el.playbackRate = 1
  }
  playing.value = false
  stopProgressLoop()
  progress.value = 0
  currentSec.value = 0
  speedIndex.value = 0
  endDrag()
}

function onExternalStop(e: Event) {
  const detail = (e as CustomEvent<{ except?: string }>).detail
  if (detail?.except !== playerId) stopPlayback()
}

function cycleSpeed() {
  speedIndex.value = (speedIndex.value + 1) % PLAYBACK_SPEEDS.length
  applyPlaybackRate()
}

async function togglePlay() {
  const el = audioRef.value
  if (!el || !props.url || loadError.value) return

  if (playing.value) {
    el.pause()
    playing.value = false
    stopProgressLoop()
    return
  }

  window.dispatchEvent(
    new CustomEvent(WA_AUDIO_STOP_EVENT, { detail: { except: playerId } })
  )

  applyPlaybackRate()

  try {
    await el.play()
    playing.value = true
    startProgressLoop()
  } catch {
    playing.value = false
    stopProgressLoop()
  }
}

function onWaveformPointerDown(e: PointerEvent) {
  if (!props.url || loadError.value || e.button !== 0) return
  beginDrag(e)
}

function onScrubberPointerDown(e: PointerEvent) {
  if (!props.url || loadError.value || e.button !== 0) return
  e.preventDefault()
  beginDrag(e)
}

function beginDrag(e: PointerEvent) {
  isDragging.value = true
  activePointerId = e.pointerId
  waveformRef.value?.setPointerCapture(e.pointerId)
  seekToRatio(ratioFromClientX(e.clientX))
  window.addEventListener('pointermove', onWindowPointerMove)
  window.addEventListener('pointerup', onWindowPointerUp)
  window.addEventListener('pointercancel', onWindowPointerUp)
}

function onWindowPointerMove(e: PointerEvent) {
  if (!isDragging.value || activePointerId !== e.pointerId) return
  seekToRatio(ratioFromClientX(e.clientX))
}

function onWindowPointerUp(e: PointerEvent) {
  if (!isDragging.value || activePointerId !== e.pointerId) return
  seekToRatio(ratioFromClientX(e.clientX))
  endDrag()
  if (playing.value) startProgressLoop()
}

function endDrag() {
  const pointerId = activePointerId
  isDragging.value = false
  activePointerId = null
  window.removeEventListener('pointermove', onWindowPointerMove)
  window.removeEventListener('pointerup', onWindowPointerUp)
  window.removeEventListener('pointercancel', onWindowPointerUp)
  if (pointerId !== null) {
    try {
      waveformRef.value?.releasePointerCapture(pointerId)
    } catch {
      /* sin captura activa */
    }
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
  endDrag()
  stopPlayback()
})
</script>
