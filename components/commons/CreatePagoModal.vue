<template>
    <UModal :open="true" class="max-w-lg" @close="emit('close')" @update:open="(v: boolean) => { if (!v) emit('close') }">
        <template #header>
            <div class="text-center align-middle flex-1">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ editComprobante ? 'Editar comprobante' : (soloComprobante ? 'Subir comprobante' : 'Registrar Pago de Cliente') }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    <span class="font-medium">{{ tituloComprobante || props.clienteNombre }}</span>
                </p>
            </div>
        </template>
        <template #body>
            <div class="space-y-6 flex flex-col gap-4 items-center">
                <!-- Monto, Banco, Fecha: solo si no es soloComprobante -->
                <template v-if="!soloComprobante">
                    <div class="w-1/2">
                        <UFormField label="Monto" name="monto">
                            <UInput v-model="formData.monto" type="number" placeholder="0.00" step="0.01" min="0"
                                class="w-full">
                                <template #leading>
                                    <span class="text-gray-500">{{ props.currency=='USD'?'$':'S/' }}</span>
                                </template>
                            </UInput>
                        </UFormField>
                    </div>

                    <div class="w-1/2">
                        <UFormField label="Banco" name="banco">
                            <URadioGroup v-model="formData.banco" :items="bancoOptions" :multiple="false" variant="list"
                                orientation="horizontal" class="flex flex-col items-center"
                                :ui="{item: 'flex flex-col-reverse items-center gap-2 p-1'}">
                                <template #label="{ item }">
                                    <div class="">
                                        <img :src="item.icon" alt="Banco" class="w-15 h-15 rounded-md">
                                    </div>
                                </template>
                            </URadioGroup>
                        </UFormField>
                    </div>

                    <UFormField label="Fecha Cierre" required class="w-1/2">
                        <UPopover>
                            <UButton color="neutral" variant="outline" icon="i-lucide-calendar" class="w-full">
                                {{ fecha ? df.format(fecha.toDate(getLocalTimeZone())) : 'Seleccione una fecha'
                                }}
                            </UButton>

                            <template #content>
                                <UCalendar v-model="fecha" class="p-2 w-full" />
                            </template>
                        </UPopover>
                    </UFormField>
                </template>

                <!-- Voucher / Comprobante: en modo edición se muestra en FileUploader y se puede reemplazar -->
                <div class="col-span-2 w-full">
                    <UFormField :label="editComprobante ? 'Comprobante (puedes cambiar el archivo)' : (soloComprobante ? 'Comprobante' : 'Voucher')" name="voucher">
                        <div v-if="editComprobante" class="w-full">
                            <FileUploader
                                :initial-files="editInitialFileList"
                                :multiple="true"
                                :show-remove-button="true"
                                :show-save-button="false"
                                :accepted-types="['.pdf', '.docx', '.xlsx', '.xls', '.doc', '.xlsm', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.rar']"
                                @file-added="handleEditFileAdded"
                                @file-removed="handleEditFileRemoved"
                            />
                        </div>
                        <div v-else-if="initialVoucher" class="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <UIcon name="i-heroicons-document" class="w-5 h-5 text-gray-500" />
                            <span class="text-sm truncate flex-1">{{ initialVoucher.name }}</span>
                        </div>
                        <template v-else>
                            <!-- Vista previa cuando hay archivo seleccionado -->
                            <div
                                v-if="selectedFile"
                                class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800/50"
                            >
                                <div class="p-3 flex items-start gap-3">
                                    <div v-if="isImageFile(selectedFile)" class="flex-shrink-0">
                                        <img
                                            :src="previewObjectUrl"
                                            alt="Vista previa"
                                            class="w-20 h-20 object-cover rounded border border-gray-200 dark:border-gray-600"
                                        />
                                    </div>
                                    <div v-else class="flex-shrink-0 w-14 h-14 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                        <UIcon name="i-heroicons-document" class="w-8 h-8 text-gray-500" />
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ selectedFile.name }}</p>
                                        <p class="text-xs text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
                                    </div>
                                    <UButton
                                        icon="i-heroicons-x-mark"
                                        color="neutral"
                                        variant="ghost"
                                        size="xs"
                                        @click="clearSelectedFile"
                                    />
                                </div>
                            </div>
                            <FileUploader
                                v-else
                                ref="fileUploaderRef"
                                :show-remove-button="true"
                                :accepted-types="['.pdf', '.docx', '.xlsx', '.xls', '.doc', '.xlsm', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.rar']"
                                :multiple="false"
                                @file-added="handleFileAdded"
                                @file-removed="handleFileRemoved"
                                :show-save-button="false"
                            />
                        </template>
                    </UFormField>
                </div>
            </div>
        </template>

        <!-- Footer Actions -->
        <template #footer="{ close }">
            <div class="flex justify-end space-x-3">
                <UButton label="Cancelar" size="xl" color="neutral" variant="ghost" @click="() => { emit('close'); close() }" />
                <UButton :label="soloComprobante ? 'Aceptar' : 'Guardar'" size="xl" color="primary" @click="() => {
                    handleSave()
                }" />
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, computed, shallowRef } from 'vue'
import FileUploader from './FileUploader.vue'
import type { FileItem } from '~/types/commons/file'
import { CalendarDate } from '@internationalized/date'
import { getLocalTimeZone, DateFormatter, } from '@internationalized/date'
/** Comprobante existente para modo edición (monto, banco, fecha; opcionalmente reemplazar archivo). */
export interface EditComprobante {
    id: number
    monto?: string | null
    banco?: string | null
    fecha_cierre?: string | null
    url?: string
    nombre_original?: string
}
interface Props {
    clienteNombre: string
    currency: string
    /** Si se abre desde un FileUploader (p. ej. sección Pago servicio), el archivo ya viene seleccionado */
    initialVoucher?: File | null
    /** Solo mostrar subida de comprobante (sin monto, banco, fecha). Se usa en Verificación > Permisos. */
    soloComprobante?: boolean
    /** Título opcional cuando soloComprobante (ej. "Derecho trámite - Permiso X", "Tramitador") */
    tituloComprobante?: string
    /** Si se pasa, el modal está en modo edición: prefill monto/banco/fecha y muestra preview del comprobante actual (no subida). */
    editComprobante?: EditComprobante
}
const props = withDefaults(defineProps<Props>(), {
    currency: 'USD',
    soloComprobante: false,
    tituloComprobante: '',
    editComprobante: undefined
})
const isEditMode = computed(() => !!props.editComprobante)
/** En modo edición: archivo nuevo seleccionado para reemplazar al actual (se emite al guardar). */
const selectedFileForReplace = ref<File | null>(null)
/** Lista de un ítem para FileUploader en edición: el comprobante actual (desde URL). */
const editInitialFileList = computed<FileItem[]>(() => {
    const ed = props.editComprobante
    if (!ed) return []
    const name = ed.nombre_original || 'Comprobante'
    const ext = name.includes('.') ? name.split('.').pop() || '' : ''
    return [{
        id: ed.id,
        file_name: name,
        file_url: ed.url ?? null,
        type: ext,
        size: 0,
        lastModified: 0,
        file_ext: ext,
    }]
})
const selectedFile = ref<File | null>(null)
const previewObjectUrl = ref<string | null>(null)

watch(() => props.initialVoucher, (f) => {
    selectedFile.value = f ?? null
}, { immediate: true })

watch(selectedFile, (file) => {
    if (previewObjectUrl.value) {
        URL.revokeObjectURL(previewObjectUrl.value)
        previewObjectUrl.value = null
    }
    if (file && isImageFile(file)) {
        previewObjectUrl.value = URL.createObjectURL(file)
    }
}, { immediate: true })

onUnmounted(() => {
    if (previewObjectUrl.value) URL.revokeObjectURL(previewObjectUrl.value)
})

function isImageFile(file: File): boolean {
    return file.type.startsWith('image/')
}
function isImageUrl(url: string): boolean {
    if (!url) return false
    const u = url.toLowerCase()
    return u.includes('.jpg') || u.includes('.jpeg') || u.includes('.png') || u.includes('.gif') || u.includes('.webp')
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function clearSelectedFile() {
    selectedFile.value = null
    if (previewObjectUrl.value) {
        URL.revokeObjectURL(previewObjectUrl.value)
        previewObjectUrl.value = null
    }
}

const handleFileAdded = (file: File) => {
    selectedFile.value = file
}
const df = new DateFormatter('en-US', {
    dateStyle: 'medium'
})
const hoy = new Date();

const fecha = shallowRef(new CalendarDate(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate()))

function parseFechaCierre(str: string | null | undefined): CalendarDate | null {
    if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null
    const [y, m, d] = str.split('-').map(Number)
    return new CalendarDate(y, m, d)
}

// Emits
const emit = defineEmits<{
    'save': [data: any]
    'close': []
}>()

// Form data
const formData = ref({
    monto: '',
    banco: [] as string[],
    fecha: null,
    voucher: null as File | null
})

watch(() => props.editComprobante, (ed) => {
    if (ed) {
        formData.value.monto = ed.monto ?? ''
        formData.value.banco = ed.banco ? [ed.banco] : []
        const parsed = parseFechaCierre(ed.fecha_cierre)
        if (parsed) fecha.value = parsed
        selectedFileForReplace.value = null
    }
}, { immediate: true })

// Bank options for UCheckboxGroup
const bancoOptions = [
    {
        label: 'BCP',
        value: 'BCP',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Logo_credito.gif'
    },
    {
        label: 'INTERBANK',
        value: 'INTERBANK',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Interbank_logo.svg'
    },
    {
        label: 'YAPE',
        value: 'YAPE',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Icono_de_la_aplicaci%C3%B3n_Yape.png'
    }
]

// Accepted file types

// Methods
const closeModal = () => {
    resetForm()
}

const resetForm = () => {
    formData.value = {
        monto: '',
        banco: [],
        fecha: new Date().toISOString().split('T')[0],
        voucher: null as File | null
    } as any
}



const handleFileRemoved = (index: number) => {
    formData.value.voucher = null as File | null
}

function handleEditFileAdded(file: File) {
    selectedFileForReplace.value = file
}

function handleEditFileRemoved(indexOrId: number) {
    // Si quitan el archivo seleccionado (siempre en índice 0 cuando hay uno nuevo), limpiamos el reemplazo
    if (indexOrId === 0) selectedFileForReplace.value = null
}

const handleSave = () => {
    if (props.soloComprobante && !props.editComprobante) {
        if (!selectedFile.value) return
        emit('save', { voucher: selectedFile.value })
        emit('close')
        return
    }

    // Modo edición: monto, banco, fecha; opcionalmente voucher (archivo nuevo para reemplazar)
    if (props.editComprobante) {
        if (!formData.value.monto || formData.value.banco.length === 0 || !fecha.value) return
        const bancoVal = Array.isArray(formData.value.banco) ? formData.value.banco[0] : formData.value.banco
        emit('save', {
            monto: formData.value.monto,
            banco: bancoVal,
            fecha: fecha.value,
            voucher: selectedFileForReplace.value ?? undefined,
        })
        emit('close')
        return
    }

    // Validación básica (registro de pago completo)
    if (!formData.value.monto || formData.value.banco.length === 0 || !fecha.value) {
        return
    }
    if (!selectedFile.value) {
        return
    }

    const pagoData = {
        ...formData.value,
        voucher: selectedFile.value,
        fecha: fecha.value
    }

    emit('save', pagoData)
    emit('close')
}
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
