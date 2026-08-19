<template>
  <UModal
    v-model:open="isOpen"
    class="sm:max-w-3xl"
    :dismissible="false"
    @update:open="onOpenChange"
  >
    <template #header="{ close }">
      <div class="flex items-start justify-between gap-3 w-full">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Recordatorio de pago
          </h3>
          <p class="text-sm text-gray-500 mt-1">
            Revisa el PDF y el mensaje. Recién se envía al confirmar.
          </p>
          <p v-if="preview" class="text-xs text-gray-400 mt-0.5">
            <span v-if="preview.cliente">{{ preview.cliente }}</span>
            <span v-if="preview.carga"> · Carga {{ preview.carga }}</span>
            <span v-if="preview.phone"> · {{ preview.phone }}</span>
          </p>
        </div>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-x-mark-20-solid"
          class="-my-1"
          aria-label="Cerrar"
          :disabled="loading"
          @click="close()"
        />
      </div>
    </template>

    <template #body>
      <div class="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div v-if="loadingPreview" class="flex items-center justify-center gap-2 text-sm text-gray-500 py-10">
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
          Armando vista previa…
        </div>

        <p v-else-if="previewError" class="text-sm text-red-600 dark:text-red-400 py-4">
          {{ previewError }}
        </p>

        <template v-else-if="preview">
          <div>
            <p class="text-xs font-medium text-gray-500 mb-1.5">Mensaje que se enviará</p>
            <div class="rounded-2xl rounded-tl-sm bg-[#dcf8c6] dark:bg-emerald-900/40 px-3 py-2 shadow-sm">
              <p class="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed">
                {{ preview.message }}
              </p>
            </div>
          </div>

          <div>
            <p class="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
              <UIcon name="i-heroicons-paper-clip" class="w-3.5 h-3.5" />
              PDF cotización final
            </p>
            <div
              v-if="pdfLoading"
              class="flex items-center gap-2 text-xs text-gray-500 py-10 justify-center rounded-lg bg-gray-50 dark:bg-gray-800"
            >
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              Cargando PDF…
            </div>
            <p v-else-if="pdfError" class="text-sm text-red-600 dark:text-red-400 py-2">
              {{ pdfError }}
            </p>
            <template v-else-if="pdfSrc">
              <iframe
                :src="pdfSrc"
                class="w-full h-80 rounded-lg border border-gray-200 dark:border-gray-700 bg-white"
                title="Vista previa PDF cotización final"
              />
              <div class="flex justify-end mt-1">
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  label="Abrir PDF"
                  icon="i-heroicons-arrow-top-right-on-square"
                  @click="openPdf"
                />
              </div>
            </template>
            <p v-else class="text-xs text-gray-500 italic">
              Esta cotización no tiene PDF de cotización final.
            </p>
          </div>
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="outline" label="Cancelar" :disabled="loading" @click="isOpen = false" />
        <UButton
          color="primary"
          label="Confirmar y enviar"
          :loading="loading"
          :disabled="loadingPreview || !!previewError || !preview"
          @click="confirm"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { useReminderPago } from '~/composables/cargaconsolidada/cotizacion-final/useReminderPago'
import type { ReminderPagoPreview } from '~/types/cargaconsolidada/cotizacion-final/general'

const props = defineProps<{
  open: boolean
  idCotizacion: number | null
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
}>()

const { previewReminderPago, downloadCotizacionFinalPdfBlob } = useReminderPago()

const preview = ref<ReminderPagoPreview | null>(null)
const previewError = ref<string | null>(null)
const loadingPreview = ref(false)
const pdfSrc = ref<string | null>(null)
const pdfLoading = ref(false)
const pdfError = ref<string | null>(null)
let objectUrl: string | null = null

const isOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v),
})

const revokePdf = () => {
  if (objectUrl) {
    try {
      window.URL.revokeObjectURL(objectUrl)
    } catch {
      // ignore
    }
    objectUrl = null
  }
  pdfSrc.value = null
}

const loadPreview = async () => {
  preview.value = null
  previewError.value = null
  pdfError.value = null
  revokePdf()
  if (!props.open || !props.idCotizacion) return

  loadingPreview.value = true
  try {
    const res = await previewReminderPago(props.idCotizacion)
    if (!res.success || !res.data) {
      previewError.value = res.message || 'No se pudo armar la vista previa'
      return
    }
    preview.value = res.data
    if (res.data.has_pdf) {
      await loadPdf(props.idCotizacion)
    }
  } catch (e: unknown) {
    previewError.value = e instanceof Error ? e.message : 'No se pudo armar la vista previa'
  } finally {
    loadingPreview.value = false
  }
}

const loadPdf = async (id: number) => {
  pdfLoading.value = true
  pdfError.value = null
  try {
    const raw = await downloadCotizacionFinalPdfBlob(id)
    const pdfBlob = raw instanceof Blob
      ? raw
      : new Blob([raw as BlobPart], { type: 'application/pdf' })
    if (pdfBlob.type && pdfBlob.type.includes('json')) {
      throw new Error('No se pudo generar el PDF')
    }
    objectUrl = window.URL.createObjectURL(pdfBlob)
    pdfSrc.value = objectUrl
  } catch (e: unknown) {
    pdfError.value = e instanceof Error ? e.message : 'No se pudo cargar el PDF'
  } finally {
    pdfLoading.value = false
  }
}

const openPdf = () => {
  if (pdfSrc.value) window.open(pdfSrc.value, '_blank', 'noopener,noreferrer')
}

const onOpenChange = (v: boolean) => {
  emit('update:open', v)
}

const confirm = () => {
  emit('confirm')
}

watch(
  () => [props.open, props.idCotizacion] as const,
  ([open]) => {
    if (open) loadPreview()
    else {
      preview.value = null
      previewError.value = null
      revokePdf()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  revokePdf()
})
</script>
