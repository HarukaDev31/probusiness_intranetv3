<template>
  <div class="min-h-screen w-full bg-gray-50 dark:bg-gray-900 flex flex-col p-4">
    <UCard class="shadow-lg mb-4">
      <template #header>
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">
            Cargo de Entrega
            <span v-if="hasSignedPdf" class="text-sm text-green-600 dark:text-green-400 ml-2">✅ Documento firmado</span>
          </h1>
          <UButton
            variant="ghost"
            icon="i-heroicons-arrow-left"
            :to="`/cargaconsolidada/coordinacion/completados/entrega/${idContenedor}`"
          >
            Volver
          </UButton>
        </div>
      </template>
      <template #footer>
        <div class="flex items-center justify-center py-2">
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ totalPages }} página(s)</span>
        </div>
      </template>
    </UCard>

    <div class="flex-grow flex justify-center">
      <UCard class="shadow-lg h-full w-full">
        <div class="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden min-h-[500px] flex justify-center">
          <div ref="scrollContainer" class="pdf-scroll-container relative p-4 w-full overflow-auto max-h-[70vh]">
            <!-- Overlay de carga (como firma-acuerdo-servicio) -->
            <div v-if="!isPdfLoaded" class="absolute inset-0 z-10 flex flex-col items-center justify-center space-y-4 bg-gray-100 dark:bg-gray-800">
              <UIcon name="i-heroicons-document-text" class="w-16 h-16 text-gray-400 animate-pulse" />
              <p class="text-gray-500">Cargando documento...</p>
            </div>
            <!-- PDF siempre en DOM para que los canvas existan al renderizar -->
            <div ref="pdfViewer" class="pdf-content-wrapper flex flex-col items-center gap-4">
              <div
                v-for="pageNum in totalPages"
                :key="pageNum"
                class="page-wrapper"
              >
                <div class="page-container">
                  <canvas
                    :ref="(el) => setCanvasRef(el, pageNum)"
                    class="block bg-white dark:bg-gray-700 shadow-lg rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <div class="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex gap-4 mt-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 flex items-center gap-2">
        <UButton
          @click="zoomOut"
          :disabled="currentScale <= minScale"
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-heroicons-minus"
        />
        <span class="text-sm text-gray-600 dark:text-gray-300 min-w-[50px] text-center">
          {{ Math.round(currentScale * 100) }}%
        </span>
        <UButton
          @click="zoomIn"
          :disabled="currentScale >= maxScale"
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-heroicons-plus"
        />
      </div>
      <div v-if="!hasSignedPdf" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 flex items-center gap-2">
        <UButton
          @click="openSignatureModal"
          color="primary"
          variant="solid"
          size="sm"
          icon="i-heroicons-pencil"
        >
          Firmar
        </UButton>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 flex items-center gap-2">
        <UButton
          @click="downloadPDF"
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-heroicons-arrow-down-tray"
        >
          {{ hasSignedPdf ? 'Descargar firmado' : 'Descargar' }}
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

const route = useRoute()
const idCotizacion = Number(route.params.id)
const idContenedor = Number(route.query.id_contenedor)

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

const renderPage = async (pageNum: number) => {
  if (!pdfDoc.value) return
  const page = await pdfDoc.value.getPage(pageNum)
  const viewport = page.getViewport({ scale: currentScale.value })
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

const zoomIn = async () => {
  if (currentScale.value < maxScale.value) {
    currentScale.value = Math.min(maxScale.value, currentScale.value + 0.25)
    await renderAllPages()
  }
}

const zoomOut = async () => {
  if (currentScale.value > minScale.value) {
    currentScale.value = Math.max(minScale.value, currentScale.value - 0.25)
    await renderAllPages()
  }
}

const loadPDF = async () => {
  try {
    isPdfLoaded.value = false
    if (!idContenedor || !idCotizacion) {
      throw new Error('Faltan parámetros: id_contenedor e id_cotizacion')
    }
    await getCargoEntregaPdf(idContenedor, idCotizacion, false)
    if (!hasPdf.value || !pdfUrl.value) {
      throw new Error('No se encontró el PDF de cargo de entrega')
    }
    await initPdfJs()
    // Cargar vía fetch para evitar problemas cross-origin con PDF.js
    const res = await fetch(pdfUrl.value, { credentials: 'include' })
    if (!res.ok) throw new Error('No se pudo cargar el PDF')
    const arrayBuffer = await res.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    pdfDoc.value = markRaw(pdf)
    totalPages.value = pdf.numPages
    await nextTick()
    await nextTick() // Doble nextTick para que los refs del canvas estén listos
    await renderAllPages()
    isPdfLoaded.value = true
  } catch (err: any) {
    console.error('Error cargando PDF:', err)
    // El composable ya muestra el error
  }
}

const openSignatureModal = () => {
  firmaModal.open({
    onClose: () => firmaModal.close(),
    onConfirm: async (data) => {
      firmaModal.close()
      const result = await signCargoEntrega({
        id_contenedor: idContenedor,
        id_cotizacion: idCotizacion,
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
  if (pdfDoc.value) {
    pdfDoc.value.destroy?.()
  }
})
</script>

<style scoped>
.pdf-scroll-container {
  overflow: auto;
  min-height: 400px;
}
.pdf-content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.page-container {
  position: relative;
}
canvas {
  display: block;
}
</style>
