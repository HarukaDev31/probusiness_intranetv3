<template>
    <UModal>
        <template #header>
            <h2 class="text-xl font-semibold">{{ props.mode === 'edit' ? 'Editar viático' : 'Crear viático o reintegro' }}</h2>
        </template>

        <template #body>
            <div class="p-6 space-y-6">
                <div class="space-y-4">
                    <!-- Asunto -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Asunto <span class="text-red-500">*</span>
                        </label>
                        <UInput v-model="formData.subject" placeholder="Ej: Solicitud de reintegro de viáticos" class="w-full" />
                    </div>

                    <!-- Fecha de Reintegro -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Fecha de Reintegro <span class="text-red-500">*</span>
                        </label>
                        <UPopover>
                            <UButton color="neutral" variant="outline" icon="i-lucide-calendar" class="w-full">
                                {{ reimbursementCalendar ? df.format(reimbursementCalendar.toDate(getLocalTimeZone())) : 'Seleccione una fecha' }}
                            </UButton>

                            <template #content>
                                <UCalendar v-model="reimbursementCalendar" class="p-2 w-full" />
                            </template>
                        </UPopover>
                    </div>

                    <!-- Área Solicitante -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Área Solicitante <span class="text-red-500">*</span>
                        </label>
                        <USelect v-model="formData.requesting_area" :items="areaOptions" placeholder="Seleccionar área" class="w-full" />
                    </div>

                    <!-- Descripción del Gasto -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Descripción del Gasto <span class="text-red-500">*</span>
                        </label>
                        <UTextarea v-model="formData.expense_description" placeholder="Ej: Apoyo entregas provincia carga # 20" class="w-full" rows="3" />
                    </div>

                    <!-- Monto Total -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Monto Total (S/) <span class="text-red-500">*</span>
                        </label>
                        <UInput v-model.number="formData.total_amount" type="number" step="0.01" min="0" placeholder="0.00" class="w-full">
                            <template #leading>
                                <span class="text-gray-500">S/</span>
                            </template>
                        </UInput>
                    </div>

                    <!-- Uploader -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Comprobante
                        </label>
                        <FileUploader 
                            ref="fileUploaderRef" 
                            :multiple="false" 
                            :accepted-types="['.jpg', '.jpeg', '.png', '.gif','.pdf','.doc','.docx']"
                            @file-added="handleFileAdded"
                            @file-removed="handleFileRemoved"
                            :show-save-button="false"
                        />
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
import type { CreateViaticoRequest } from '~/types/viatico'

interface Props {
    onClose?: () => void
    onSave?: (data: CreateViaticoRequest) => void
    initialData?: Partial<CreateViaticoRequest>
    mode?: 'create' | 'edit'
}

const props = defineProps<Props>()

const loading = ref(false)
const selectedFile = ref<File | null>(null)
const fileUploaderRef = ref<InstanceType<typeof FileUploader> | null>(null)

const formData = ref<CreateViaticoRequest>({
    subject: '',
    reimbursement_date: '',
    requesting_area: '',
    expense_description: '',
    total_amount: 0,
    receipt_file: null
})

// Estado para UCalendar
const reimbursementCalendar = ref<CalendarDate | null>(null)
const df = new DateFormatter('es-PE', { dateStyle: 'medium' })

const stringToCalendarDate = (dateString?: string): CalendarDate | null => {
    if (!dateString) return null
    try {
        const date = new Date(dateString)
        return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
    } catch {
        return null
    }
}

const calendarDateToString = (calendarDate: CalendarDate | null): string | undefined => {
    if (!calendarDate) return undefined
    try {
        const date = calendarDate.toDate(getLocalTimeZone())
        return date.toISOString().split('T')[0]
    } catch {
        return undefined
    }
}

// Inicializar reimbursementCalendar si hay fecha en initialData
if (props.initialData?.reimbursement_date) {
    reimbursementCalendar.value = stringToCalendarDate(props.initialData.reimbursement_date)
} else if (formData.value.reimbursement_date) {
    reimbursementCalendar.value = stringToCalendarDate(formData.value.reimbursement_date)
}

// Sincronizar calendar -> formData.reimbursement_date
watch(reimbursementCalendar, (newVal) => {
    const str = calendarDateToString(newVal) || ''
    formData.value.reimbursement_date = str
})

const areaOptions = [
    { label: 'Marketing', value: 'Marketing' },
    { label: 'Ventas', value: 'Ventas' },
    { label: 'Importaciones', value: 'Importaciones' },
    { label: 'Administración', value: 'Administración' },
    { label: 'Otros', value: 'Otros' }
]

const primaryLabel = computed(() => (props.mode === 'edit' ? 'Actualizar' : 'Guardar'))

// Inicializar form con datos si vienen por props (modo edición)
if (props.initialData) {
    formData.value = {
        ...formData.value,
        ...props.initialData
    }
}

// Validación
const isValid = computed(() => {
    return (
        formData.value.subject.trim() !== '' &&
        formData.value.reimbursement_date !== '' &&
        formData.value.requesting_area.trim() !== '' &&
        formData.value.expense_description.trim() !== '' &&
        formData.value.total_amount > 0
    )
})

// Manejadores de eventos
const handleFileAdded = (file: File) => {
    selectedFile.value = file
    formData.value.receipt_file = file
}

const handleFileRemoved = () => {
    selectedFile.value = null
    formData.value.receipt_file = null
}

const handleSave = (close: () => void) => {
    if (!isValid.value) return

    if (props.onSave) {
        props.onSave({
            ...formData.value,
            receipt_file: selectedFile.value
        })
        close()
    }
}
</script>
