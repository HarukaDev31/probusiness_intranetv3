<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap items-center gap-1.5">
      <UButton
        icon="i-heroicons-minus"
        size="xs"
        color="neutral"
        variant="outline"
        title="Alejar"
        aria-label="Alejar"
        :disabled="!zoomable || scale <= minScale"
        @click="zoomBy(-0.25)"
      />
      <span class="min-w-11 text-center text-xs font-bold text-highlighted">{{ Math.round(scale * 100) }}%</span>
      <UButton
        icon="i-heroicons-plus"
        size="xs"
        color="neutral"
        variant="outline"
        title="Acercar"
        aria-label="Acercar"
        :disabled="!zoomable || scale >= maxScale"
        @click="zoomBy(0.25)"
      />
      <UButton size="xs" color="neutral" variant="outline" title="Ajustar al visor" :disabled="!zoomable" @click="reset">Ajustar</UButton>
      <UButton
        v-if="isImage"
        size="xs"
        :color="lens ? 'primary' : 'neutral'"
        :variant="lens ? 'soft' : 'outline'"
        icon="i-heroicons-magnifying-glass"
        title="Lupa para leer el importe y el N.° de operación"
        @click="toggleLens"
      >
        Lupa
      </UButton>
      <UButton
        class="ml-auto"
        size="xs"
        color="neutral"
        variant="outline"
        icon="i-heroicons-arrows-pointing-out"
        title="Pantalla completa"
        @click="openFullscreen()"
      >
        Pantalla completa
      </UButton>
    </div>

    <div
      ref="viewport"
      class="relative flex min-h-52 max-h-[52vh] items-start justify-center overflow-auto rounded-lg border border-default bg-elevated"
      @scroll="lensVisible = false"
    >
      <img
        v-if="isImage && url"
        :src="url"
        :alt="name || 'Comprobante'"
        class="block max-w-none select-none"
        :style="{ width: `${scale * 100}%`, cursor: lens ? 'crosshair' : 'default' }"
        draggable="false"
        @mousemove="onLensMove"
        @mouseleave="lensVisible = false"
      >
      <div
        v-if="isImage && lens && lensVisible"
        class="pointer-events-none absolute z-10 size-[170px] rounded-full border-[3px] border-primary bg-white shadow-xl"
        :style="lensStyle"
      />

      <div v-if="isPdf" class="flex w-full flex-col items-center gap-2 p-2">
        <p v-if="loading" class="py-6 text-sm text-muted">Preparando vista previa…</p>
        <canvas
          v-for="page in pageCount"
          :key="page"
          :ref="(el) => setCanvas(el, page)"
          class="max-w-none rounded border border-default bg-white"
          :style="{ width: `${scale * 100}%` }"
        />
        <!-- Fallback: si el CDN bloquea pdf.js (CORS), se usa el visor nativo del navegador. -->
        <iframe
          v-if="pdfFallback && url"
          :src="`${url}${url.includes('#') ? '' : '#view=FitH'}`"
          class="h-[50vh] w-full rounded border-0 bg-white"
          title="Comprobante PDF"
        />
        <p v-if="pdfFallback" class="text-xs text-muted">Vista previa del navegador.</p>
      </div>

      <div v-if="!isImage && !isPdf" class="flex flex-col items-center gap-2 px-4 py-10 text-center">
        <UIcon name="i-heroicons-document" class="size-10 text-muted" />
        <p class="text-sm text-muted">Vista previa no disponible para este archivo.</p>
        <UButton
          v-if="url"
          :to="url"
          target="_blank"
          rel="noopener"
          size="sm"
          color="primary"
          variant="soft"
          icon="i-heroicons-arrow-top-right-on-square"
        >
          Abrir archivo
        </UButton>
      </div>
    </div>

    <!-- Como el diseño enviado: ícono de información + texto legible. -->
    <p class="flex items-center gap-2 text-sm text-default">
      <UIcon name="i-heroicons-information-circle" class="size-5 shrink-0 text-highlighted" />
      {{ isImage
        ? 'Activa la lupa y pasa el cursor sobre la imagen para leer el importe y el N.° de operación.'
        : 'Usa «Pantalla completa» para revisar el comprobante con más detalle.' }}
    </p>
    <UModal v-model:open="fullscreen" :title="name || 'Comprobante'" fullscreen>
      <template #body>
        <div class="flex h-full flex-col gap-2">
          <div class="flex flex-wrap items-center gap-1.5">
            <UButton
              icon="i-heroicons-minus"
              size="xs"
              color="neutral"
              variant="outline"
              :disabled="!zoomable || scale <= minScale"
              @click="zoomBy(-0.25)"
            />
            <span class="min-w-11 text-center text-xs font-bold">{{ Math.round(scale * 100) }}%</span>
            <UButton
              icon="i-heroicons-plus"
              size="xs"
              color="neutral"
              variant="outline"
              :disabled="!zoomable || scale >= maxScale"
              @click="zoomBy(0.25)"
            />
            <UButton size="xs" color="neutral" variant="outline" @click="reset">Ajustar</UButton>
            <UButton
              v-if="isImage"
              size="xs"
              :color="lens ? 'primary' : 'neutral'"
              :variant="lens ? 'soft' : 'outline'"
              icon="i-heroicons-magnifying-glass"
              title="Lupa"
              @click="toggleLens"
            >
              Lupa
            </UButton>
          </div>

          <div
            v-if="isImage && url"
            class="relative flex flex-1 items-start justify-center overflow-auto rounded-lg border border-default bg-elevated"
          >
            <img
              :src="url"
              :alt="name || 'Comprobante'"
              class="block max-w-none select-none"
              :style="{ width: `${scale * 100}%`, cursor: lens ? 'crosshair' : 'default' }"
              draggable="false"
              @mousemove="onLensMove"
              @mouseleave="lensVisible = false"
            >
            <div
              v-if="lens && lensVisible"
              class="pointer-events-none absolute z-10 size-[190px] rounded-full border-[3px] border-primary bg-white shadow-xl"
              :style="lensStyle"
            />
          </div>
          <iframe
            v-else-if="isPdf && url"
            :src="url"
            class="h-[80vh] w-full border-0"
            title="Comprobante PDF"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, nextTick, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  url: string | null
  name?: string | null
}>(), {
  name: null
})

const scale = ref(1)
const minScale = 1
const maxScale = 4
const lens = ref(true)
const lensVisible = ref(false)
const lensPosition = ref({ x: 0, y: 0 })
const lensBackground = ref<{ size: string; position: string }>({ size: '0px 0px', position: '0px 0px' })
const fullscreen = ref(false)
const viewport = ref<HTMLElement | null>(null)

const extension = computed(() => {
  const source = props.url || props.name || ''
  const match = /\.(png|jpe?g|webp|gif|bmp|svg|pdf)(\?|$)/i.exec(source)
  return match ? match[1].toLowerCase() : ''
})
const isImage = computed(() => ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(extension.value))
const isPdf = computed(() => extension.value === 'pdf')

/**
 * El CDN de comprobantes no devuelve cabeceras CORS, así que `fetch` falla siempre:
 * con un PDF de otro origen se usa directamente el visor nativo (sin espera ni error).
 */
const crossOriginPdf = computed(() => {
  if (!isPdf.value || !props.url) return false
  if (typeof window === 'undefined') return false
  try {
    return new URL(props.url, window.location.href).origin !== window.location.origin
  } catch {
    return false
  }
})

/** Zoom disponible: imágenes y PDF del mismo origen (en el visor nativo no se puede escalar). */
const zoomable = computed(() => isImage.value || (isPdf.value && !pdfFallback.value))

/* ---------------- PDF (pdf.js legacy, carga diferida) ---------------- */
const pdfCanvases = ref<Record<number, HTMLCanvasElement>>({})
const pageCount = ref(0)
const loading = ref(false)
const pdfFallback = ref(false)
let pdfjsLib: any = null

function setCanvas(el: unknown, page: number) {
  if (el instanceof HTMLCanvasElement) pdfCanvases.value[page] = el
}

async function renderPdf() {
  if (!props.url || !isPdf.value) return
  if (crossOriginPdf.value) {
    // Sin CORS no hay canvas: el visor del navegador aparece al instante.
    pdfFallback.value = true
    loading.value = false
    return
  }
  loading.value = true
  pdfFallback.value = false
  try {
    const { getPdfJsLegacy, loadPdfDocument } = await import('~/utils/pdfJsLegacy')
    if (!pdfjsLib) pdfjsLib = markRaw(await getPdfJsLegacy())
    const buffer = await fetch(props.url).then((response) => response.arrayBuffer())
    const document = await loadPdfDocument(pdfjsLib, buffer).promise
    pageCount.value = document.numPages
    await nextTick()
    for (let page = 1; page <= document.numPages; page++) {
      const pdfPage = await document.getPage(page)
      const canvas = pdfCanvases.value[page]
      const context = canvas?.getContext('2d')
      if (!canvas || !context) continue
      const pdfViewport = pdfPage.getViewport({ scale: 1.35 })
      canvas.width = pdfViewport.width
      canvas.height = pdfViewport.height
      await pdfPage.render({ canvasContext: context, viewport: pdfViewport }).promise
    }
  } catch {
    // El CDN puede no permitir CORS: se muestra el PDF con el visor del navegador.
    pageCount.value = 0
    pdfFallback.value = true
  } finally {
    loading.value = false
  }
}

watch(() => [props.url, isPdf.value], () => {
  pdfCanvases.value = {}
  pageCount.value = 0
  pdfFallback.value = false
  reset()
  if (isPdf.value) void renderPdf()
}, { immediate: true })

/* ---------------- Zoom y lupa ---------------- */
function zoomBy(delta: number) {
  scale.value = Math.min(maxScale, Math.max(minScale, Number((scale.value + delta).toFixed(2))))
}

function reset() {
  scale.value = 1
  lensVisible.value = false
  nextTick(() => viewport.value?.scrollTo({ top: 0, left: 0 }))
}

function toggleLens() {
  lens.value = !lens.value
  lensVisible.value = false
}

function openFullscreen() {
  fullscreen.value = true
}

const lensStyle = computed(() => ({
  left: `${lensPosition.value.x - 85}px`,
  top: `${lensPosition.value.y - 85}px`,
  backgroundImage: `url("${props.url || ''}")`,
  backgroundRepeat: 'no-repeat',
  backgroundSize: lensBackground.value.size,
  backgroundPosition: lensBackground.value.position
}))

function onLensMove(event: MouseEvent) {
  if (!lens.value || !isImage.value) return
  const image = event.currentTarget as HTMLImageElement
  const bounds = image.getBoundingClientRect()
  if (!bounds.width || !bounds.height) return

  const container = viewport.value
  const containerBounds = container?.getBoundingClientRect()
  lensPosition.value = {
    x: containerBounds ? event.clientX - containerBounds.left + container.scrollLeft : event.clientX - bounds.left,
    y: containerBounds ? event.clientY - containerBounds.top + container.scrollTop : event.clientY - bounds.top
  }

  // Proporción del puntero dentro de la imagen (0..1) → fondo ampliado de la lupa.
  const ratioX = (event.clientX - bounds.left) / bounds.width
  const ratioY = (event.clientY - bounds.top) / bounds.height
  const lensSize = 170
  const zoomFactor = 2.6
  const backgroundWidth = bounds.width * zoomFactor
  const backgroundHeight = bounds.height * zoomFactor
  lensBackground.value = {
    size: `${backgroundWidth}px ${backgroundHeight}px`,
    position: `${lensSize / 2 - ratioX * backgroundWidth}px ${lensSize / 2 - ratioY * backgroundHeight}px`
  }
  lensVisible.value = true
}
</script>
