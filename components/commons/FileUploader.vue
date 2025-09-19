<template>
    <div class="space-y-4">
        <!-- Zona de subida solo visible si no hay archivos iniciales o si es multiple -->
        <div v-if=" (multiple || (!multiple && (!initialFiles || initialFiles.length === 0) && selectedFiles.length === 0))">
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

        <!-- Lista de archivos seleccionados -->
        <div v-if="selectedFiles.length > 0" class="space-y-2">
            <div v-for="(file, index) in selectedFiles" :key="getFileKey(file, index)"
                class="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                <div class="flex items-center gap-3" @click="openFile(file as File)">
                    <FileIcon :file="file" class="w-8 h-8"/>
                    <div>
                        <p class="text-sm font-medium">{{ file.name }}</p>
                        <p class="text-xs text-gray-500">{{ formatFileSize(file.size) }}</p>
                    </div>
                </div>
                <div>
                    <UButton color="primary" variant="ghost" class="p-2" @click="saveFile(file)">
                        <UIcon name="i-heroicons-arrow-up-tray" />
                    </UButton>
                    <UButton v-if="showRemoveButton" color="neutral" variant="ghost" class="p-1" @click="removeSelectedFile(index)">
                        <UIcon name="i-heroicons-trash" class="text-lg" />
                    </UButton>
                    
                </div>
            </div>
        </div>

        <!-- Lista de archivos iniciales -->
        <div v-if="initialFiles && initialFiles.length > 0" class="space-y-2">
            <div v-for="file in initialFiles" :key="file.id" 
                class="flex items-center justify-between p-3 border border-gray-200 rounded-lg transition-colors">
                <div class="flex items-center gap-3" @click="openFile(file)">
                    <FileIcon :file="file" class="w-8 h-8" />
                    <div>
                        <p class="text-sm font-medium select-none cursor-default" style="word-break: break-all;">{{ file.file_name }}</p>
                        <p class="text-xs select-none cursor-default">{{ formatFileSize(file.size || 0) }}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <UButton variant="ghost" class="p-2" @click="downloadFileExisting(file.file_url)"
                        title="Descargar archivo" color="secondary">
                       
                        <UIcon name="i-heroicons-arrow-down-tray"  
                   
                        />
                    </UButton>
                    <UButton v-if="showRemoveButton" color="error" variant="ghost" class="p-2" @click="removeFile(file.id)"
                        title="Eliminar archivo">
                        <UIcon name="i-heroicons-trash" />
                    </UButton>
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
    loading?: boolean
    immediate?: boolean
    showSaveButton?: boolean
    showRemoveButton?: boolean
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
    loading: false,
    immediate: true,
    showSaveButton: false,
    showRemoveButton: true
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
            a.download = 'archivo'
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