<template>
    <div class="space-y-4">
        <!-- Zona de subida solo visible si no hay archivos iniciales o si es multiple -->
        <div v-if="showDropZone">
            <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                    <p class="text-sm">{{ customMessage || 'Selecciona o arrastra tu archivo aquí' }}</p>
                    <p class="text-xs">Formatos: {{ acceptedTypesText }}</p>
                </div>
                <UButton  v-if="!disabled" color="neutral" variant="soft" class="whitespace-nowrap" @click.stop="handleSelectFiles">
                    Subir archivo
                </UButton>
            </div>

            <!-- Input oculto para la selección de archivos -->
            <input type="file" ref="fileInput" class="hidden" :multiple="multiple" :accept="acceptedTypes?.join(',')"
                @change="handleFileInputChange" />

            <!-- Zona de drop -->
            <div v-show="isDragOver" class="fixed inset-0 z-50 flex items-center justify-center"
                @dragover.prevent="handleDragOver" @dragleave.prevent="handleDragLeave" @drop.prevent="handleDrop">
                <div class="bg-white p-8 rounded-lg shadow-lg text-center">
                    <UIcon name="i-heroicons-arrow-up-tray" class="text-6xl text-primary-500 mb-4" />
                    <p class="text-lg font-medium">Suelta los archivos aquí</p>
                </div>
            </div>
        </div>

        <!-- Una sola lista: primero seleccionados (pendientes de subir), luego ya subidos -->
        <div v-if="allFilesList.length > 0" class="space-y-2">
            <div
                v-for="(item, index) in allFilesList"
                :key="item.key"
                class="flex items-center justify-between p-3 rounded-lg border border-gray-200"
            >
                <div class="flex items-center gap-3" @click="openFile(item.raw)">
                    <FileIcon :file="item.raw" class="w-8 h-8" />
                    <div>
                        <p class="text-sm font-medium" :class="item.isInitial ? 'select-none cursor-default' : ''" style="word-break: break-all;">{{ item.name }}</p>
                        <p class="text-xs" :class="item.isInitial ? 'select-none cursor-default text-gray-500' : 'text-gray-500'">{{ item.sizeText }}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-1">
                    <template v-if="item.isInitial">
                        <UButton variant="ghost" class="p-2" title="Descargar" color="secondary" @click="downloadFileExisting((item.raw as FileItem).file_url)">
                            <UIcon name="i-heroicons-arrow-down-tray" />
                        </UButton>
                        <UButton v-if="showRemoveButton && !readOnly" color="error" variant="ghost" class="p-2" title="Eliminar" @click="removeFile((item.raw as FileItem).id)">
                            <UIcon name="i-heroicons-trash" />
                        </UButton>
                    </template>
                    <template v-else>
                        <UButton v-if="showSaveButton" color="primary" variant="ghost" class="p-2" title="Subir" @click="saveFile(item.raw as File)">
                            <UIcon name="i-heroicons-arrow-up-tray" />
                        </UButton>
                        <UButton v-if="showRemoveButton && !readOnly" color="neutral" variant="ghost" class="p-1" @click="removeSelectedFile(item.selectedIndex ?? 0)">
                            <UIcon name="i-heroicons-trash" class="text-lg" />
                        </UButton>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { UIcon } from '#components'
import type { FileItem } from '@/types/commons/file'
import FileIcon from './FileIcon.vue'
import { useSpinner } from '@/composables/commons/useSpinner'
import { useOverlay } from '#imports'
import ModalPreview from './ModalPreview.vue'
const overlay = useOverlay()
const modalPreview = overlay.create(ModalPreview)
interface Props {
    multiple?: boolean
    maxFileSize?: number
    acceptedTypes?: string[]
    customMessage?: string
    disabled?: boolean
    initialFiles?: FileItem[] | FileItem
    /** Archivos File que el padre controla (p. ej. pendientes de guardar). Se muestran en la lista como seleccionados. */
    modelFiles?: File[]
    loading?: boolean
    immediate?: boolean
    showSaveButton?: boolean
    showRemoveButton?: boolean
    /** Solo ver/descargar: oculta la zona de subida y no permite añadir ni quitar. */
    readOnly?: boolean
}

interface Emits {
    (e: 'files-selected', files: File[]): void
    (e: 'file-added', file: File): void
    (e: 'file-removed', index: number): void
    (e: 'files-cleared'): void
    (e: 'error', message: string): void
    (e: 'save-file', file: File): void
}

const props = withDefaults(defineProps<Props>(), {
    multiple: false,
    maxFileSize: 200 * 1024 * 1024,
    acceptedTypes: () => ['.pdf', '.docx', '.xlsx', '.xls', '.doc', '.xlsm', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.rar'],
    customMessage: undefined,
    disabled: false,
    initialFiles: () => [],
    modelFiles: () => [],
    loading: false,
    immediate: true,
    showSaveButton: false,
    showRemoveButton: true,
    readOnly: false
})

const emit = defineEmits<Emits>()
const { withSpinner } = useSpinner()

// Referencias y estado
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFiles = ref<File[]>([])
const isDragOver = ref(false)

const acceptedTypesText = computed(() => {
    return props.acceptedTypes
        ?.map(type => type.replace('.', '').toUpperCase())
        .join(', ')
})

/** Lista a mostrar como archivos seleccionados: la que controla el padre (modelFiles) o la interna (selectedFiles). */
const displayedSelectedFiles = computed(() =>
    (props.modelFiles?.length ? props.modelFiles : selectedFiles.value)
)

/** Una sola lista unificada: primero seleccionados (pendientes), luego iniciales (ya subidos). */
const allFilesList = computed(() => {
    const list: { key: string; name: string; sizeText: string; raw: File | FileItem; isInitial: boolean; selectedIndex?: number }[] = []
    const selected = displayedSelectedFiles.value
    selected.forEach((file, i) => {
        list.push({
            key: `sel-${getFileKey(file, i)}`,
            name: file.name,
            sizeText: formatFileSize(file.size),
            raw: file,
            isInitial: false,
            selectedIndex: i,
        })
    })
    const initial = props.initialFiles ?? []
    initial.forEach((file) => {
        list.push({
            key: `init-${file.id}`,
            name: file.file_name,
            sizeText: formatFileSize(file.size || 0),
            raw: file,
            isInitial: true,
        })
    })
    return list
})

const showDropZone = computed(() =>
    !props.readOnly &&
    (props.multiple ||
        ((!props.initialFiles || props.initialFiles.length === 0) &&
            selectedFiles.value.length === 0 &&
            (!props.modelFiles || props.modelFiles.length === 0)))
)

const handleSelectFiles = () => {
    fileInput.value?.click()
}

const handleFileInputChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (target.files) {
        const files = Array.from(target.files)
        addFiles(files)
        target.value = '' // Limpiar input para permitir seleccionar el mismo archivo
    }
}

const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    isDragOver.value = true
}

const handleDragLeave = (event: DragEvent) => {
    event.preventDefault()
    isDragOver.value = false
}

const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    isDragOver.value = false
    if (event.dataTransfer?.files) {
        const files = Array.from(event.dataTransfer.files)
        addFiles(files)
    }
}
const saveFile = (file: File) => {
   emit('save-file', file)
}

const addFiles = (files: File[]) => {
    const validFiles: File[] = []

    files.forEach(file => {
        if (!isValidFileType(file)) {
            emit('error', `Tipo de archivo no permitido: ${file.name}`)
            return
        }

        if (file.size > props.maxFileSize!) {
            emit('error', `Archivo demasiado grande: ${file.name} (${formatFileSize(file.size)})`)
            return
        }

        validFiles.push(file)
    })
   
    if (validFiles.length > 0) {
        if (props.modelFiles?.length) {
            emit('files-selected', validFiles)
            validFiles.forEach(file => emit('file-added', file))
            return
        }
        if (props.multiple) {
            selectedFiles.value.push(...validFiles)
        } else {
            selectedFiles.value = [validFiles[0]]
        }

        emit('files-selected', selectedFiles.value)
        validFiles.forEach(file => emit('file-added', file))
    }
}

const removeSelectedFile = (index: number) => {
    if (props.modelFiles?.length) {
        emit('file-removed', index)
        return
    }
    selectedFiles.value.splice(index, 1)
    emit('file-removed', index)
}

const isValidFileType = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    return props.acceptedTypes!.some(type =>
        type.startsWith('.') ? extension === type : file.type.includes(type)
    )
}

const getFileKey = (file: File, index: number): string => {
    return `file-${file.name}-${file.size}-${index}`
}

const openFile = (file: FileItem|File) => {
    modalPreview.open({
        file: file,
        isOpen: true
    })
}

const generateFileName = (url: string): string => {
    if (!url) return 'archivo'
    
    const urlParts = url.split('/')
    const fileName = urlParts[urlParts.length - 1]
    
    try {
        return decodeURIComponent(fileName)
    } catch {
        return fileName
    }
}

const downloadFileExisting = async (file_url: string | null) => {
    if (!file_url) return

    try {
        await withSpinner(async () => {
            const response = await fetch(file_url)
            if (!response.ok) throw new Error(`Error al descargar: ${response.status}`)

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = generateFileName(file_url)
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        }, 'Descargando archivo...')
    } catch (error) {
        emit('error', 'Error al descargar archivo')
    }
}

const removeFile = (id: number) => {
    emit('file-removed', id)
}

// Exponer métodos
defineExpose({
    getFiles: () => selectedFiles.value,
    addFiles,
    removeFile,
    clearSelectedFiles: () => {
        selectedFiles.value = []
        emit('files-cleared')
    }
})
</script>

<style scoped>
.drag-over {
    border-color: #4f46e5;
    background-color: #eef2ff;
}
</style>