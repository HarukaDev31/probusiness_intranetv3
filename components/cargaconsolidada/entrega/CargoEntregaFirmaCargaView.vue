<template>
  <div class="min-h-screen w-full bg-gray-50 dark:bg-gray-900 flex flex-col p-2 sm:p-4 pb-20 sm:pb-6">
    <!-- Header compacto -->
    <div class="flex items-center justify-between mb-2 sm:mb-4 px-1">
      <div class="flex items-center gap-2 min-w-0">
        <UButton
          variant="ghost"
          icon="i-heroicons-arrow-left"
          :to="backUrl"
          size="xs"
          class="shrink-0"
        />
        <h1 class="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
          Cargo de Entrega
        </h1>
        <span v-if="hasSignedPdf" class="shrink-0 inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full">
          <UIcon name="i-heroicons-check-circle-solid" class="w-3 h-3" />
          Firmado
        </span>
      </div>
      <span class="text-[10px] sm:text-xs text-gray-400 shrink-0">{{ totalPages }} pág.</span>
    </div>

    <!-- Área PDF -->
    <div class="flex-grow min-h-0 relative">
      <div
        ref="scrollContainer"
        class="pdf-viewport"
        @mousedown="onDragStart"
        @touchstart.passive="onTouchStart"
      >
        <div v-if="!isPdfLoaded" class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800">
          <UIcon name="i-heroicons-document-text" class="w-10 h-10 sm:w-16 sm:h-16 text-gray-400 animate-pulse" />
          <p class="text-xs sm:text-base text-gray-500">Cargando documento...</p>
        </div>
        <div ref="pdfViewer" class="pdf-pages">
          <div v-for="pageNum in totalPages" :key="pageNum" class="pdf-page">
            <canvas
              :ref="(el) => setCanvasRef(el, pageNum)"
              class="block bg-white dark:bg-gray-700 shadow-md rounded"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Barra inferior compacta -->
    <div class="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-700 px-2 py-1.5 sm:py-2 sm:static sm:mt-3 sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:px-0">
      <div class="flex items-center justify-center gap-2 sm:gap-3">
        <UButton @click="zoomOut" :disabled="currentScale <= minScale" color="neutral" variant="ghost" size="xs" icon="i-heroicons-minus" />
        <span class="text-[11px] sm:text-sm text-gray-500 min-w-[36px] text-center tabular-nums">{{ Math.round(currentScale * 100) }}%</span>
        <UButton @click="zoomIn" :disabled="currentScale >= maxScale" color="neutral" variant="ghost" size="xs" icon="i-heroicons-plus" />
        <div class="w-px h-4 bg-gray-300 dark:bg-gray-600" />
        <UButton v-if="!hasSignedPdf" @click="openSignatureModal" color="primary" variant="solid" size="xs" icon="i-heroicons-pencil">Firmar</UButton>
        <UButton @click="downloadPDF" color="neutral" variant="outline" size="xs" icon="i-heroicons-arrow-down-tray">
          {{ hasSignedPdf ? 'Firmado' : 'Descargar' }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, markRaw } from 'vue'
import FirmaEntregaModal from '~/components/cargaconsolidada/entrega/FirmaEntregaModal.vue'
import { useFirmaCarga } from '~/composables/cargaconsolidada/entrega/useFirmaCarga'
import { useOverlay } from '#imports'

const props = defineProps<{
  backUrl: string
  idCotizacion: number
  idContenedor: number
}>()

const overlay = useOverlay()
const firmaModal = overlay.create(FirmaEntregaModal)
let pdfjsLib: any = null
const pdfDoc = ref<any>(null)
const totalPages = ref(0)
const isPdfLoaded = ref(false)
const currentScale = ref(1.0)
const minScale = ref(0.5)
const maxScale = ref(3.0)
const pdfCanvases = ref<Record<number, HTMLCanvasElement>>({})
const scrollContainer = ref<HTMLElement | null>(null)
const pdfViewer = ref<HTMLElement | null>(null)

const {
  getCargoEntregaPdf,
  signCargoEntrega,
  downloadCargoEntrega,
  pdfUrl,
  hasSignedPdf,
  hasPdf
} = useFirmaCarga()

const setCanvasRef = (el: any, pageNum: number) => {
  if (el) pdfCanvases.value[pageNum] = el
}

const initPdfJs = async () => {
  if (pdfjsLib) return
  const pdfjs = await import('pdfjs-dist')
  pdfjsLib = markRaw(pdfjs)
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs'
}

let baseScale = 1.0

const renderPage = async (pageNum: number) => {
  if (!pdfDoc.value) return
  const page = await pdfDoc.value.getPage(pageNum)
  const effectiveScale = baseScale * currentScale.value
  const viewport = page.getViewport({ scale: effectiveScale })
  const canvas = pdfCanvases.value[pageNum]
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  canvas.height = viewport.height
  canvas.width = viewport.width
  await page.render({
    canvasContext: ctx,
    viewport
  }).promise
}

const renderAllPages = async () => {
  if (!pdfDoc.value) return
  for (let p = 1; p <= totalPages.value; p++) {
    await renderPage(p)
  }
}

const applyZoom = async (newScale: number) => {
  const container = scrollContainer.value
  if (!container) {
    currentScale.value = newScale
    await renderAllPages()
    return
  }

  const oldScale = currentScale.value
  const scrollW = container.scrollWidth
  const scrollH = container.scrollHeight
  const fracX = scrollW > 0 ? (container.scrollLeft + container.clientWidth / 2) / scrollW : 0.5
  const fracY = scrollH > 0 ? (container.scrollTop + container.clientHeight / 2) / scrollH : 0.5

  currentScale.value = newScale
  await renderAllPages()
  await nextTick()

  const newScrollW = container.scrollWidth
  const newScrollH = container.scrollHeight
  container.scrollLeft = fracX * newScrollW - container.clientWidth / 2
  container.scrollTop = fracY * newScrollH - container.clientHeight / 2
}

const zoomIn = async () => {
  if (currentScale.value < maxScale.value) {
    await applyZoom(Math.min(maxScale.value, +(currentScale.value + 0.25).toFixed(2)))
  }
}

const zoomOut = async () => {
  if (currentScale.value > minScale.value) {
    await applyZoom(Math.max(minScale.value, +(currentScale.value - 0.25).toFixed(2)))
  }
}

// --- Drag to scroll (mouse) ---
let isDragging = false
let dragStartX = 0
let dragStartY = 0
let scrollStartX = 0
let scrollStartY = 0

const onDragStart = (e: MouseEvent) => {
  const container = scrollContainer.value
  if (!container) return
  if (container.scrollWidth <= container.clientWidth && container.scrollHeight <= container.clientHeight) return
  isDragging = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  scrollStartX = container.scrollLeft
  scrollStartY = container.scrollTop
  container.style.cursor = 'grabbing'
  container.style.userSelect = 'none'
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
}

const onDragMove = (e: MouseEvent) => {
  if (!isDragging) return
  const container = scrollContainer.value
  if (!container) return
  container.scrollLeft = scrollStartX - (e.clientX - dragStartX)
  container.scrollTop = scrollStartY - (e.clientY - dragStartY)
}

const onDragEnd = () => {
  isDragging = false
  const container = scrollContainer.value
  if (container) {
    container.style.cursor = ''
    container.style.userSelect = ''
  }
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
}

// --- Touch drag ---
let touchStartX = 0
let touchStartY = 0
let touchScrollX = 0
let touchScrollY = 0

const onTouchStart = (e: TouchEvent) => {
  const container = scrollContainer.value
  if (!container || e.touches.length !== 1) return
  if (container.scrollWidth <= container.clientWidth && container.scrollHeight <= container.clientHeight) return
  const t = e.touches[0]
  touchStartX = t.clientX
  touchStartY = t.clientY
  touchScrollX = container.scrollLeft
  touchScrollY = container.scrollTop
  container.addEventListener('touchmove', onTouchMove, { passive: false })
  container.addEventListener('touchend', onTouchEnd)
}

const onTouchMove = (e: TouchEvent) => {
  const container = scrollContainer.value
  if (!container || e.touches.length !== 1) return
  e.preventDefault()
  const t = e.touches[0]
  container.scrollLeft = touchScrollX - (t.clientX - touchStartX)
  container.scrollTop = touchScrollY - (t.clientY - touchStartY)
}

const onTouchEnd = () => {
  const container = scrollContainer.value
  if (container) {
    container.removeEventListener('touchmove', onTouchMove)
    container.removeEventListener('touchend', onTouchEnd)
  }
}

const loadPDF = async () => {
  try {
    isPdfLoaded.value = false
    if (!props.idContenedor || !props.idCotizacion) {
      throw new Error('Faltan parámetros: id_contenedor e id_cotizacion')
    }
    await getCargoEntregaPdf(props.idContenedor, props.idCotizacion, false)
    if (!hasPdf.value || !pdfUrl.value) {
      throw new Error('No se encontró el PDF de cargo de entrega')
    }
    await initPdfJs()
    const res = await fetch(pdfUrl.value, { credentials: 'include' })
    if (!res.ok) throw new Error('No se pudo cargar el PDF')
    const arrayBuffer = await res.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    pdfDoc.value = markRaw(pdf)
    totalPages.value = pdf.numPages

    const firstPage = await pdf.getPage(1)
    const defaultViewport = firstPage.getViewport({ scale: 1.0 })

    await nextTick()
    await new Promise(resolve => requestAnimationFrame(resolve))

    const container = scrollContainer.value
    const containerWidth = container ? container.clientWidth : window.innerWidth
    const padding = container ? parseFloat(getComputedStyle(container).paddingLeft) * 2 : 8
    baseScale = Math.max(0.5, (containerWidth - padding) / defaultViewport.width)
    currentScale.value = 1.0

    await nextTick()
    await renderAllPages()
    isPdfLoaded.value = true
  } catch (err: any) {
    console.error('Error cargando PDF:', err)
  }
}

const openSignatureModal = () => {
  firmaModal.open({
    onClose: () => firmaModal.close(),
    onConfirm: async (data) => {
      firmaModal.close()
      const result = await signCargoEntrega({
        id_contenedor: props.idContenedor,
        id_cotizacion: props.idCotizacion,
        nombre: data.nombre,
        dni: data.dni,
        signature: data.signatureData
      })
      if (result?.success) {
        await loadPDF()
      }
    }
  })
}

const downloadPDF = () => {
  downloadCargoEntrega()
}

onMounted(() => {
  loadPDF()
})

onUnmounted(() => {
  onDragEnd()
  if (pdfDoc.value) {
    pdfDoc.value.destroy?.()
  }
})
</script>

<style scoped>
.pdf-viewport {
  position: absolute;
  inset: 0;
  overflow: auto;
  background: var(--color-gray-100);
  border-radius: 0.5rem;
  cursor: grab;
  -webkit-overflow-scrolling: touch;
}
.pdf-viewport:active {
  cursor: grabbing;
}
:root.dark .pdf-viewport {
  background: var(--color-gray-800);
}
.pdf-pages {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  min-width: 100%;
  min-height: 100%;
  box-sizing: border-box;
}
@media (min-width: 640px) {
  .pdf-pages {
    gap: 1rem;
    padding: 1rem;
  }
}
.pdf-page {
  flex-shrink: 0;
}
.pdf-page canvas {
  display: block;
}
</style>
