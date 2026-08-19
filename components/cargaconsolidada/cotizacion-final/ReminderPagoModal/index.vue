<template>
  <UModal
    v-model:open="isOpen"
    class="sm:max-w-6xl"
    :ui="{ content: 'sm:max-w-6xl' }"
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
      <p v-if="previewError" class="text-sm text-red-600 dark:text-red-400 mb-3">
        {{ previewError }}
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-1">
        <div class="min-w-0">
          <p class="text-xs font-medium text-gray-500 mb-1.5">Mensaje que se enviará</p>
          <div v-if="!preview && !previewError" class="space-y-2 rounded-2xl rounded-tl-sm bg-gray-50 dark:bg-gray-800 px-3 py-3">
            <USkeleton class="h-4 w-2/3" />
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-5/6" />
            <USkeleton class="h-4 w-3/4" />
            <USkeleton class="h-4 w-1/2" />
          </div>
          <div
            v-else-if="preview"
            class="rounded-2xl rounded-tl-sm bg-[#dcf8c6] dark:bg-emerald-900/40 px-3 py-2 shadow-sm"
          >
            <p class="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed">
              {{ preview.message }}
            </p>
          </div>
        </div>

        <div class="min-w-0">
          <p class="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
            <UIcon name="i-heroicons-paper-clip" class="w-3.5 h-3.5" />
            PDF cotización final
          </p>
          <div class="relative h-80 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden">
            <div v-if="pdfLoading" class="absolute inset-0 p-3 space-y-2 z-10">
              <USkeleton class="h-full w-full rounded-md" />
            </div>
            <iframe
              v-if="pdfSrc"
              :key="pdfSrc"
              :src="pdfSrc"
              class="w-full h-full bg-white"
              title="Vista previa PDF cotización final"
              @load="pdfLoading = false"
            />
            <p
              v-else-if="!pdfLoading && (pdfError || (preview && !pdfSrc))"
              class="absolute inset-0 flex items-center justify-center text-xs text-gray-500 italic px-4 text-center"
            >
              {{ pdfError || 'Esta cotización no tiene PDF de cotización final.' }}
            </p>
          </div>
          <div v-if="pdfSrc" class="flex justify-end mt-1">
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              label="Abrir PDF"
              icon="i-heroicons-arrow-top-right-on-square"
              @click="openPdf"
            />
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="outline" label="Cancelar" :disabled="loading" @click="() => { isOpen = false }" />
        <UButton
          color="primary"
          label="Confirmar y enviar"
          :loading="loading"
          :disabled="!!previewError || !preview"
          @click="confirm"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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

const { previewReminderPago } = useReminderPago()

const preview = ref<ReminderPagoPreview | null>(null)
const previewError = ref<string | null>(null)
const pdfSrc = ref<string | null>(null)
const pdfLoading = ref(false)
const pdfError = ref<string | null>(null)

const isOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v),
})

const reset = () => {
  preview.value = null
  previewError.value = null
  pdfSrc.value = null
  pdfLoading.value = false
  pdfError.value = null
}

const loadPreview = async () => {
  if (!props.open || !props.idCotizacion) {
    reset()
    return
  }

  preview.value = null
  previewError.value = null
  pdfSrc.value = null
  pdfError.value = null
  pdfLoading.value = true

  try {
    const res = await previewReminderPago(props.idCotizacion)
    if (!res.success || !res.data) {
      previewError.value = res.message || 'No se pudo armar la vista previa'
      pdfLoading.value = false
      return
    }
    preview.value = res.data
    if (res.data.pdf_url) {
      pdfSrc.value = res.data.pdf_url
    } else {
      pdfLoading.value = false
    }
  } catch (e: unknown) {
    previewError.value = e instanceof Error ? e.message : 'No se pudo armar la vista previa'
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
    else reset()
  },
  { immediate: true },
)
</script>
