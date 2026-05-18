<template>
  <div class="relative flex min-h-0 flex-1 flex-col bg-neutral-950">
    <div class="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-end p-3">
      <div class="pointer-events-auto flex flex-col gap-2">
        <UButton
          type="button"
          color="neutral"
          variant="solid"
          size="md"
          icon="i-heroicons-arrow-path-rounded-square"
          class="rounded-full shadow-lg"
          title="Rotar 90°"
          @click="rotar"
        />
        <UButton
          type="button"
          :color="modoDibujar ? 'primary' : 'neutral'"
          variant="solid"
          size="md"
          icon="i-heroicons-pencil"
          class="rounded-full shadow-lg"
          title="Dibujar"
          @click="toggleDibujar"
        />
      </div>
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="modoDibujar && paletaAbierta"
        class="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2 px-2"
      >
        <div
          class="flex items-center gap-2 rounded-full border border-white/10 bg-neutral-900/95 px-3 py-2 shadow-xl backdrop-blur-sm"
        >
          <button
            v-for="c in SOPORTE_TI_IMAGEN_COLORES"
            :key="c"
            type="button"
            class="size-7 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-neutral-900 transition"
            :class="color === c ? 'ring-white' : 'ring-transparent'"
            :style="{ backgroundColor: c }"
            :title="c"
            @click="color = c"
          />
          <UButton
            type="button"
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-heroicons-chevron-up"
            class="ml-1 shrink-0 text-white/70"
            title="Ocultar paleta"
            @click="paletaAbierta = false"
          />
        </div>
        <div
          class="flex items-center gap-3 rounded-full border border-white/10 bg-neutral-900/95 px-4 py-2 shadow-xl backdrop-blur-sm"
        >
          <button
            v-for="g in SOPORTE_TI_IMAGEN_GROSORES"
            :key="g"
            type="button"
            class="flex size-8 items-center justify-center rounded-full transition"
            :class="grosor === g ? 'bg-white/15' : 'hover:bg-white/10'"
            :title="`Grosor ${g}px`"
            @click="grosor = g"
          >
            <span
              class="rounded-full bg-white"
              :style="{ width: `${Math.min(g, 14)}px`, height: `${Math.min(g, 14)}px` }"
            />
          </button>
        </div>
      </div>
    </Transition>

    <UButton
      v-if="modoDibujar && !paletaAbierta"
      type="button"
      color="neutral"
      variant="solid"
      size="sm"
      icon="i-heroicons-chevron-down"
      class="absolute bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full shadow-lg"
      title="Mostrar colores"
      @click="paletaAbierta = true"
    />

    <div
      ref="contenedorRef"
      class="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3 sm:p-6"
    >
      <div ref="marcoRef" class="relative inline-flex max-w-full">
        <img
          ref="imgRef"
          :src="srcInterno"
          :alt="nombreArchivo"
          class="block max-h-[min(52vh,520px)] max-w-full select-none object-contain"
          draggable="false"
          @load="syncCanvas"
        >
        <canvas
          ref="trazoRef"
          class="absolute left-0 top-0 touch-none"
          :class="modoDibujar ? 'cursor-crosshair' : 'pointer-events-none'"
          @mousedown="iniciarTrazo"
          @mousemove="seguirTrazo"
          @mouseup="finTrazo"
          @mouseleave="finTrazo"
          @touchstart.prevent="iniciarTrazoTouch"
          @touchmove.prevent="seguirTrazoTouch"
          @touchend.prevent="finTrazo"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  SOPORTE_TI_IMAGEN_COLORES,
  SOPORTE_TI_IMAGEN_GROSORES,
  combinarImagenConTrazos,
  canvasAArchivo
} from '~/utils/soporteTiImagenEditor'

const props = defineProps<{
  src: string
  nombreArchivo: string
}>()

const emit = defineEmits<{
  update: [payload: { file: File; preview: string }]
}>()

const imgRef = ref<HTMLImageElement | null>(null)
const trazoRef = ref<HTMLCanvasElement | null>(null)
const marcoRef = ref<HTMLElement | null>(null)

const srcInterno = ref(props.src)
const modoDibujar = ref(false)
const paletaAbierta = ref(true)
const color = ref<string>(SOPORTE_TI_IMAGEN_COLORES[2])
const grosor = ref<number>(SOPORTE_TI_IMAGEN_GROSORES[1])

const dibujando = ref(false)
const ultimoX = ref(0)
const ultimoY = ref(0)
let resizeObs: ResizeObserver | null = null

watch(
  () => props.src,
  (nuevo) => {
    srcInterno.value = nuevo
    limpiarTrazos()
    nextTick(() => syncCanvas())
  }
)

onMounted(() => {
  if (marcoRef.value) {
    resizeObs = new ResizeObserver(() => syncCanvas())
    resizeObs.observe(marcoRef.value)
  }
})

onUnmounted(() => {
  resizeObs?.disconnect()
})

function toggleDibujar() {
  modoDibujar.value = !modoDibujar.value
  if (modoDibujar.value) paletaAbierta.value = true
}

function limpiarTrazos() {
  const canvas = trazoRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function syncCanvas() {
  const img = imgRef.value
  const canvas = trazoRef.value
  if (!img || !canvas || !img.complete) return

  const w = Math.round(img.clientWidth)
  const h = Math.round(img.clientHeight)
  if (w < 1 || h < 1) return

  if (canvas.width !== w || canvas.height !== h) {
    const tmp = document.createElement('canvas')
    tmp.width = canvas.width
    tmp.height = canvas.height
    tmp.getContext('2d')?.drawImage(canvas, 0, 0)
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d')?.drawImage(tmp, 0, 0, w, h)
  }

  prepararCtx()
}

function prepararCtx() {
  const ctx = trazoRef.value?.getContext('2d')
  if (!ctx) return
  ctx.strokeStyle = color.value
  ctx.lineWidth = grosor.value
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

watch([color, grosor], () => prepararCtx())

function coordsDesdeEvento(clientX: number, clientY: number) {
  const rect = trazoRef.value!.getBoundingClientRect()
  return { x: clientX - rect.left, y: clientY - rect.top }
}

function iniciarTrazo(e: MouseEvent) {
  if (!modoDibujar.value) return
  e.preventDefault()
  dibujando.value = true
  const { x, y } = coordsDesdeEvento(e.clientX, e.clientY)
  ultimoX.value = x
  ultimoY.value = y
}

function seguirTrazo(e: MouseEvent) {
  if (!dibujando.value || !modoDibujar.value) return
  e.preventDefault()
  trazarHasta(e.clientX, e.clientY)
}

function iniciarTrazoTouch(e: TouchEvent) {
  if (!modoDibujar.value || !e.touches[0]) return
  dibujando.value = true
  const t = e.touches[0]
  const { x, y } = coordsDesdeEvento(t.clientX, t.clientY)
  ultimoX.value = x
  ultimoY.value = y
}

function seguirTrazoTouch(e: TouchEvent) {
  if (!dibujando.value || !modoDibujar.value || !e.touches[0]) return
  trazarHasta(e.touches[0].clientX, e.touches[0].clientY)
}

function trazarHasta(clientX: number, clientY: number) {
  const canvas = trazoRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  prepararCtx()
  const { x, y } = coordsDesdeEvento(clientX, clientY)
  ctx.beginPath()
  ctx.moveTo(ultimoX.value, ultimoY.value)
  ctx.lineTo(x, y)
  ctx.stroke()
  ultimoX.value = x
  ultimoY.value = y
}

function finTrazo() {
  dibujando.value = false
}

function tieneTrazos(): boolean {
  const canvas = trazoRef.value
  if (!canvas?.width) return false
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 0) return true
  }
  return false
}

async function aplicar(): Promise<File | null> {
  if (!tieneTrazos()) return null
  try {
    const out = await combinarImagenConTrazos({
      src: srcInterno.value,
      rotacion: 0,
      trazoCanvas: trazoRef.value
    })
    const file = await canvasAArchivo(out, props.nombreArchivo)
    const preview = URL.createObjectURL(file)
    emit('update', { file, preview })
    srcInterno.value = preview
    limpiarTrazos()
    await nextTick()
    syncCanvas()
    return file
  } catch {
    return null
  }
}

async function rotar() {
  try {
    const out = await combinarImagenConTrazos({
      src: srcInterno.value,
      rotacion: 90,
      trazoCanvas: trazoRef.value
    })
    const file = await canvasAArchivo(out, props.nombreArchivo)
    const preview = URL.createObjectURL(file)
    emit('update', { file, preview })
    srcInterno.value = preview
    limpiarTrazos()
    await nextTick()
    syncCanvas()
  } catch {
    /* sin cambios */
  }
}

defineExpose({ aplicar })
</script>
