<template>
    <UModal>
        <template #header>
            <div class="flex justify-between items-center w-full">
                <h2 class="text-xl font-semibold">{{ props.mode === 'edit' ? 'Editar viático' : 'Crear viático o reintegro' }}</h2>
            <div class="p-1 bg-gray-100 dark:bg-gray-800 rounded-lg sticky bottom-0">
                <span class="text-lg font-semibold">{{ formatCurrency(totalAmount,'PEN') }}</span>
            </div>
            </div>
        </template>

        <template #body>
            <div class="p-6 space-y-6">
                <div class="space-y-4">
                    <!-- Asunto -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Asunto <span class="text-red-500">*</span>
                        </label>
                        <UInput v-model="formData.subject" placeholder="Ej: Solicitud de reintegro de viáticos" class="w-full" />
                    </div>

                    <!-- Fecha de Reintegro -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Fecha de Reintegro <span class="text-red-500">*</span>
                        </label>
                        <UPopover>
                            <UButton color="neutral" variant="outline" icon="i-lucide-calendar" class="w-full">
                                {{ reimbursementCalendar ? df.format(reimbursementCalendar.toDate(getLocalTimeZone())) : 'Seleccione una fecha' }}
                            </UButton>
                            <template #content>
                                <UCalendar v-model="reimbursementCalendar" :type="'date'" class="p-2 w-full" />
                            </template>
                        </UPopover>
                    </div>

                    <!-- Área Solicitante -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Área Solicitante <span class="text-red-500">*</span>
                        </label>
                        <USelect v-model="formData.requesting_area" :items="areaOptions" placeholder="Seleccionar área" class="w-full" />
                    </div>

                    <!-- Descripción del Gasto (opcional / resumen) -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Descripción del Gasto
                        </label>
                        <UTextarea v-model="formData.expense_description" placeholder="Ej: Apoyo entregas provincia carga # 20" class="w-full" :rows="2" />
                    </div>

                    <!-- Items de pago: concepto, monto, comprobante -->
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Evidencias <span class="text-red-500">*</span>
                            </label>
                            <UButton color="primary" variant="soft" size="sm" icon="i-heroicons-plus" @click="addItem">
                                Agregar concepto
                            </UButton>
                        </div>

                        <div v-for="(item, index) in paymentItems" :key="item.id" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4 space-y-3">
                            <div class="flex items-start justify-between gap-2">
                                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Item {{ index + 1 }}</span>
                                <UButton v-if="paymentItems.length > 1" color="error" variant="ghost" size="xs" icon="i-heroicons-trash" title="Quitar item" @click="removeItem(index)" />
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div class="md:col-span-2">
                                    <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Concepto <span class="text-red-500">*</span></label>
                                    <UInput v-model="item.concepto" placeholder="Ej: Pasaje Lima–Trujillo" class="w-full" />
                                </div>
                                <div class="md:col-span-2">
                                    <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Monto (S/) <span class="text-red-500">*</span></label>
                                    <UInput v-model.number="item.monto" type="number" step="0.01" min="0" placeholder="0.00" class="w-full">
                                        <template #leading>
                                            <span class="text-gray-500">S/</span>
                                        </template>
                                    </UInput>
                                </div>
                                <div class="md:col-span-2">
                                    <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Comprobante</label>
                                    <FileUploader
                                        :ref="(el) => setUploaderRef(index, el)"
                                        :multiple="false"
                                        :initial-files="initialFilesPerItem[index] || []"
                                        :accepted-types="['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx']"
                                        custom-message="Adjuntar comprobante"
                                        :show-save-button="false"
                                        @file-added="(file: File) => onItemFileAdded(index, file)"
                                        @file-removed="() => onItemFileRemoved(index)"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <template #footer="{ close }">
            <div class="flex justify-end gap-3 mt-6">
                <UButton color="neutral" variant="soft" @click="close">Cancelar</UButton>
                <UButton color="primary" :disabled="!isValid" :loading="loading" @click="handleSave(close)">{{ primaryLabel }}</UButton>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import FileUploader from '~/components/commons/FileUploader.vue'
import { USelect } from '#components'
import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'
import { formatCurrency } from '~/utils/formatters'
import type { CreateViaticoRequest, ViaticoPaymentItem, ViaticoPago } from '~/types/viatico'
import type { FileItem } from '~/types/commons/file'

interface PaymentItemRow {
  id: string
  concepto: string
  monto: number
  receipt_file?: File | null
  /** Id del pago en backend; solo para items existentes (edición) */
  pagoId?: number
  /** URL del archivo en BD; para items existentes cuando no se sube archivo nuevo */
  existingFileUrl?: string | null
}

interface InitialDataViatico extends Partial<CreateViaticoRequest> {
  id?: number
  pagos?: ViaticoPago[]
  url_comprobante?: string | null
}

interface Props {
    onClose?: () => void
    onSave?: (data: CreateViaticoRequest & { id?: number }) => void
    initialData?: InitialDataViatico
    mode?: 'create' | 'edit'
}

const props = defineProps<Props>()

const config = useRuntimeConfig()

const loading = ref(false)
let itemIdCounter = 0
const paymentItems = ref<PaymentItemRow[]>([
  { id: `item-${++itemIdCounter}`, concepto: '', monto: 0, receipt_file: null }
])
const initialFilesPerItem = ref<FileItem[][]>([])
const uploaderRefs = ref<(InstanceType<typeof FileUploader> | null)[]>([])

function fileUrlFromPago(pago: ViaticoPago): string | null {
  if (pago.file_url) return pago.file_url
  if (pago.file_path) {
    const path = String(pago.file_path).trim()
    // Si ya es URL absoluta (API a veces devuelve file_path con URL completa)
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    if (config.public?.apiBase) {
      const base = (config.public.apiBase as string).replace(/\/$/, '')
      const pathNorm = path.startsWith('/') ? path : `/${path}`
      return `${base}${pathNorm}`
    }
  }
  return null
}

function setUploaderRef(index: number, el: any) {
  if (el) {
    uploaderRefs.value[index] = el as InstanceType<typeof FileUploader>
  }
}

function addItem() {
  paymentItems.value.push({ id: `item-${++itemIdCounter}`, concepto: '', monto: 0, receipt_file: null }) // sin pagoId = nuevo
  uploaderRefs.value.push(null)
}

function removeItem(index: number) {
  paymentItems.value.splice(index, 1)
  uploaderRefs.value.splice(index, 1)
}

function onItemFileAdded(index: number, file: File) {
  const item = paymentItems.value[index]
  if (item) item.receipt_file = file
}

function onItemFileRemoved(index: number) {
  const item = paymentItems.value[index]
  if (item) item.receipt_file = null
}

const formData = ref<CreateViaticoRequest>({
    subject: '',
    reimbursement_date: '',
    requesting_area: '',
    expense_description: '',
    total_amount: 0,
    receipt_file: null,
    items: []
})

const reimbursementCalendar = ref<any>(null)
const df = new DateFormatter('es-PE', { dateStyle: 'medium' })

const stringToCalendarDate = (dateString?: string): CalendarDate | null => {
    if (!dateString) return null
    try {
        const dayPart = dateString.split('T')[0]
        const parts = dayPart.split('-')
        if (parts.length < 3) return null
        const y = parseInt(parts[0], 10)
        const m = parseInt(parts[1], 10)
        const d = parseInt(parts[2], 10)
        if (isNaN(y) || isNaN(m) || isNaN(d)) return null
        return new CalendarDate(y, m, d)
    } catch {
        return null
    }
}

const pad = (n: number) => String(n).padStart(2, '0')

const calendarDateToString = (calendarDate: any): string | undefined => {
    if (!calendarDate) return undefined
    try {
        const y = (calendarDate as any).year
        const m = (calendarDate as any).month
        const d = (calendarDate as any).day
        return `${y}-${pad(m)}-${pad(d)}`
    } catch {
        return undefined
    }
}

watch(reimbursementCalendar, (newVal) => {
    const str = calendarDateToString(newVal) || ''
    formData.value.reimbursement_date = str
})

// Sincronizar initialData al abrir en modo edición (pagos o legacy url_comprobante); reset en crear
watch(
  () => [props.initialData, props.mode] as const,
  ([initialData, mode]) => {
    if (!initialData) {
      formData.value = {
        subject: '',
        reimbursement_date: '',
        requesting_area: '',
        expense_description: '',
        total_amount: 0,
        receipt_file: null,
        items: []
      }
      reimbursementCalendar.value = null
      paymentItems.value = [{ id: `item-${++itemIdCounter}`, concepto: '', monto: 0, receipt_file: null }] // sin pagoId
      initialFilesPerItem.value = []
      uploaderRefs.value = [null]
      return
    }
    formData.value = {
      ...formData.value,
      subject: initialData.subject ?? formData.value.subject,
      reimbursement_date: initialData.reimbursement_date ?? formData.value.reimbursement_date,
      requesting_area: initialData.requesting_area ?? formData.value.requesting_area,
      expense_description: initialData.expense_description ?? formData.value.expense_description,
      total_amount: initialData.total_amount ?? formData.value.total_amount
    }
    if (initialData.reimbursement_date) {
      reimbursementCalendar.value = stringToCalendarDate(initialData.reimbursement_date)
    }

    const pagos = (initialData as InitialDataViatico).pagos
    const urlComprobante = (initialData as InitialDataViatico).url_comprobante

    if (pagos && pagos.length > 0) {
      paymentItems.value = pagos.map((p) => ({
        id: `item-${p.id}`,
        concepto: p.concepto || '',
        monto: Number(p.monto) || 0,
        receipt_file: null,
        pagoId: p.id
      }))
      initialFilesPerItem.value = pagos.map((p) => {
        const url = fileUrlFromPago(p)
        if (!url) return []
        return [{
          id: p.id,
          file_name: p.file_original_name || p.concepto || 'Comprobante',
          file_url: url,
          type: (p.file_extension || '').toLowerCase() === 'pdf' ? 'pdf' : 'image',
          size: p.file_size || 0,
          lastModified: 0,
          file_ext: p.file_extension || 'pdf'
        }]
      })
      uploaderRefs.value = pagos.map(() => null)
    } else if (urlComprobante) {
      paymentItems.value = [{
        id: `item-${++itemIdCounter}`,
        concepto: initialData.expense_description || 'Comprobante',
        monto: Number(initialData.total_amount) || 0,
        receipt_file: null
        // sin pagoId: item nuevo al editar legacy
      }]
      initialFilesPerItem.value = [[{
        id: 0,
        file_name: String(urlComprobante).split('/').pop() || 'Comprobante',
        file_url: urlComprobante,
        type: 'image',
        size: 0,
        lastModified: 0,
        file_ext: 'jpg'
      }]]
      uploaderRefs.value = [null]
    }
  },
  { immediate: true }
)

const areaOptions = [
    { label: 'Marketing', value: 'Marketing' },
    { label: 'Ventas', value: 'Ventas' },
    { label: 'Importaciones', value: 'Importaciones' },
    { label: 'Administración', value: 'Administración' },
    { label: 'Otros', value: 'Otros' }
]

const primaryLabel = computed(() => (props.mode === 'edit' ? 'Actualizar' : 'Guardar'))

const totalAmount = computed(() => {
  return paymentItems.value.reduce((sum, item) => sum + (Number(item.monto) || 0), 0)
})

const isValid = computed(() => {
  const hasSubject = formData.value.subject.trim() !== ''
  const hasDate = formData.value.reimbursement_date !== ''
  const hasArea = formData.value.requesting_area.trim() !== ''
  const hasItems = paymentItems.value.length > 0 && paymentItems.value.every(
    (item) => item.concepto.trim() !== '' && (Number(item.monto) || 0) > 0
  )
  const total = totalAmount.value
  return hasSubject && hasDate && hasArea && hasItems && total > 0
})

const handleSave = (close: () => void) => {
  if (!isValid.value || !props.onSave) return

  // Obtener archivos de cada uploader por si no se disparó file-added
  paymentItems.value.forEach((item, index) => {
    if (item.receipt_file) return
    const uploader = uploaderRefs.value[index]
    const files = (uploader as any)?.getFiles?.() as File[] | undefined
    if (files && files.length > 0) item.receipt_file = files[0]
  })

  const items: ViaticoPaymentItem[] = paymentItems.value.map((item) => {
    const payload: ViaticoPaymentItem = {
      concepto: item.concepto.trim(),
      monto: Number(item.monto) || 0,
      receipt_file: item.receipt_file ?? null
    }
    if (item.pagoId !== undefined && item.pagoId !== null) {
      payload.id = item.pagoId
    }
    // Si es item existente y no se subió archivo nuevo, enviar la URL que viene de BD
    if (item.pagoId != null && !item.receipt_file && item.existingFileUrl) {
      payload.existing_file_url = item.existingFileUrl
    }
    return payload
  })

  const payload: CreateViaticoRequest & { id?: number } = {
    subject: formData.value.subject.trim(),
    reimbursement_date: formData.value.reimbursement_date,
    requesting_area: formData.value.requesting_area,
    expense_description: formData.value.expense_description.trim() || items.map(i => i.concepto).join('; '),
    total_amount: totalAmount.value,
    items
  }
  if (props.mode === 'edit' && (props.initialData as InitialDataViatico)?.id) {
    payload.id = (props.initialData as InitialDataViatico).id
  }

  props.onSave(payload)
  close()
}
</script>
