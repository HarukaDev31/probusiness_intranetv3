<template>
  <UModal
    v-model:open="isOpen"
    class="sm:max-w-[95vw]"
    :ui="{ content: 'sm:max-w-[95vw]' }"
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
            Revisa el Excel y el mensaje. Recién se envía al confirmar.
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

      <div class="grid grid-cols-1 md:grid-cols-[minmax(280px,1fr)_minmax(0,1.6fr)] gap-4">
        <div class="min-w-0">
          <p class="text-xs font-medium text-gray-500 mb-1.5">Mensaje que se enviará</p>
          <div v-if="!preview && !previewError" class="space-y-2 rounded-2xl rounded-tl-sm bg-gray-50 dark:bg-gray-800 px-3 py-3 min-h-[32rem] h-[min(70vh,720px)]">
            <USkeleton class="h-4 w-2/3" />
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-5/6" />
            <USkeleton class="h-4 w-3/4" />
            <USkeleton class="h-4 w-1/2" />
          </div>
          <div
            v-else-if="preview"
            class="rounded-2xl rounded-tl-sm bg-[#dcf8c6] dark:bg-emerald-900/40 px-3 py-2 shadow-sm max-h-[min(70vh,720px)] overflow-y-auto"
          >
            <p class="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed">
              {{ preview.message }}
            </p>
          </div>
        </div>

        <div class="min-w-0">
          <p class="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
            <UIcon name="i-heroicons-paper-clip" class="w-3.5 h-3.5" />
            Cotización final
            <span v-if="excelRows !== null" class="font-normal text-gray-400">· Hoja 1</span>
          </p>
          <div class="relative min-h-[32rem] h-[min(70vh,720px)] rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden">
            <div v-if="showExcelSkeleton" class="absolute inset-0 p-3 z-10">
              <USkeleton class="h-full w-full rounded-md" />
            </div>
            <div
              v-else-if="excelRows !== null"
              class="h-full overflow-auto bg-white dark:bg-gray-900"
            >
              <table class="min-w-full border-collapse text-xs">
                <tbody>
                  <tr
                    v-for="(row, rowIndex) in excelRows"
                    :key="rowIndex"
                    :class="rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'"
                  >
                    <td
                      v-for="colIndex in excelColCount"
                      :key="colIndex"
                      class="px-2 py-1 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 whitespace-nowrap"
                    >
                      {{ formatExcelCell(row[colIndex - 1]) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <iframe
              v-else-if="excelEmbedSrc"
              :key="excelEmbedSrc"
              :src="excelEmbedSrc"
              class="w-full h-full bg-white"
              title="Vista previa de cotización final"
            />
            <p
              v-else-if="preview && !excelUrl"
              class="absolute inset-0 flex items-center justify-center text-xs text-gray-500 italic px-4 text-center"
            >
              Esta cotización no tiene Excel de cotización final.
            </p>
          </div>
          <div v-if="excelUrl" class="flex justify-end mt-1">
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              label="Abrir"
              icon="i-heroicons-arrow-top-right-on-square"
              @click="openExcel"
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

type ExcelCell = string | number | boolean | null | undefined
type ExcelRow = ExcelCell[]

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
const excelUrl = ref<string | null>(null)
const excelRows = ref<ExcelRow[] | null>(null)
const excelUseOffice = ref(false)
const excelLoading = ref(false)
let excelLoadSeq = 0

const excelEmbedSrc = computed(() => {
  if (!excelUseOffice.value || !excelUrl.value) return null
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(excelUrl.value)}`
})

const excelColCount = computed(() => {
  if (!excelRows.value?.length) return 0
  return Math.max(0, ...excelRows.value.map(row => row.length))
})

const showExcelSkeleton = computed(() => {
  if (previewError.value) return false
  if (excelLoading.value) return true
  return !preview.value
})

const isOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v),
})

const formatExcelCell = (value: ExcelCell) => {
  if (value === null || value === undefined) return ''
  return String(value)
}

const trimExcelRows = (rows: ExcelRow[]): ExcelRow[] => {
  let lastRow = rows.length - 1
  while (lastRow >= 0) {
    const row = rows[lastRow]
    if (row?.some(cell => cell !== null && cell !== undefined && cell !== '')) break
    lastRow--
  }
  if (lastRow < 0) return []

  const sliced = rows.slice(0, lastRow + 1)
  let lastCol = 0
  for (const row of sliced) {
    for (let i = row.length - 1; i >= lastCol; i--) {
      const cell = row[i]
      if (cell !== null && cell !== undefined && cell !== '') {
        lastCol = i + 1
        break
      }
    }
  }
  return sliced.map(row => row.slice(0, lastCol))
}

const reset = () => {
  excelLoadSeq += 1
  preview.value = null
  previewError.value = null
  excelUrl.value = null
  excelRows.value = null
  excelUseOffice.value = false
  excelLoading.value = false
}

const loadExcelSheet = async (url: string) => {
  const seq = ++excelLoadSeq
  excelRows.value = null
  excelUseOffice.value = false
  excelLoading.value = true

  try {
    const XLSX = await import('xlsx')
    const response = await fetch(url)
    if (!response.ok) throw new Error('No se pudo cargar el Excel')

    const arrayBuffer = await response.arrayBuffer()
    if (seq !== excelLoadSeq) return

    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) throw new Error('El Excel no tiene hojas')

    const worksheet = workbook.Sheets[firstSheetName]
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: false,
    }) as ExcelRow[]

    if (seq !== excelLoadSeq) return
    excelRows.value = trimExcelRows(rows)
  } catch {
    if (seq !== excelLoadSeq) return
    excelRows.value = null
    excelUseOffice.value = true
  } finally {
    if (seq === excelLoadSeq) excelLoading.value = false
  }
}

const loadPreview = async () => {
  if (!props.open || !props.idCotizacion) {
    reset()
    return
  }

  preview.value = null
  previewError.value = null
  excelUrl.value = null
  excelRows.value = null
  excelUseOffice.value = false

  try {
    const res = await previewReminderPago(props.idCotizacion)
    if (!res.success || !res.data) {
      previewError.value = res.message || 'No se pudo armar la vista previa'
      return
    }
    preview.value = res.data
    excelUrl.value = res.data.excel_url || null
    if (excelUrl.value) loadExcelSheet(excelUrl.value)
  } catch (e: unknown) {
    previewError.value = e instanceof Error ? e.message : 'No se pudo armar la vista previa'
  }
}

const openExcel = () => {
  if (excelUrl.value) window.open(excelUrl.value, '_blank', 'noopener,noreferrer')
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
