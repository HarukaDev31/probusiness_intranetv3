<template>
    <div class="space-y-4">

        <div class="file-upload-box" @click="handleSelectFiles" @dragover.prevent="handleDragOver" v-if="!disabled"
            @dragleave.prevent="handleDragLeave" @drop.prevent="handleDrop" :class="{ 'drag-over': isDragOver }">
            <input type="file" id="file-input-documentacion" class="file-input" :multiple="multiple" ref="fileInput"
                accept=".pdf, .docx, .xlsx, .xls, .doc, .xlsm, .jpg, .jpeg, .png, .gif, .zip, .rar"
                @change="handleFileInputChange" />
            <label for="file-input-documentacion" class="file-label">
                <UIcon name="i-heroicons-arrow-up-tray" class="text-4xl text-gray-400 mb-4" />
                <div class="file-group-text text-center">
                    <span class="file-text block text-lg font-medium text-gray-700 mb-2">
                        {{ isDragOver ? 'Suelta los archivos aquí' : 'Selecciona o arrastra tu archivo aquí' }}
                    </span>
                    <span class="file-format text-sm text-gray-500">
                        Formatos: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, ZIP
                    </span>
                </div>
                <UButton color="neutral" variant="ghost" class="upload-button" type="button"
                    @click.stop="handleSelectFiles">
                    Subir archivo
                </UButton>
            </label>
        </div>

        <!-- Skeleton loading -->
        <div v-if="loading" class="file-lista">
            <div class="w-full gap-2 flex flex-col max-h-[30vh] overflow-y-auto">
                <div v-for="i in 3" :key="`skeleton-${i}`"
                    class="w-full flex flex-row justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <!-- Icono skeleton -->
                    <div class="flex items-center">
                        <div class="w-8 h-8 mr-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>

                        <!-- Información skeleton -->
                        <div class="flex-1 min-w-0">
                            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse"></div>
                            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                        </div>
                    </div>

                    <!-- Acciones skeleton -->
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Lista de archivos seleccionados -->
        <div v-else class="file-lista">
            <div class=" w-full gap-2 flex flex-col max-h-[30vh] overflow-y-auto">

                <div class="w-full gap-2 flex flex-col">
                    <div v-for="file in initialFiles" :key="file.id" v-if="initialFiles.length > 0"
                        class="font-medium text-gray-900 dark:text-white  w-full flex flex-row justify-between  p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div class="flex items-center">
                            <ModalPreview :file="file" :isOpen="false">
                                <template #trigger>
                                    <FileIcon :file="file" class="w-8 h-8 mr-3" />
                                </template>
                            </ModalPreview>

                            <div class="flex-1 min-w-0">
                                <div class="">
                                    {{ file.file_name }}
                                </div>
                                <div class="file-size text-sm text-gray-500">
                                    {{ formatFileSize(file.size || 0) }}
                                </div>
                            </div>
                        </div>

                        <!-- Acciones -->
                        <div class="flex items-center space-x-2">

                            <UButton color="primary" variant="ghost" class="p-2 text-gray-500"
                                @click="downloadFileExisting(file.file_url)" title="Descargar archivo">
                                <UIcon name="i-heroicons-arrow-down-tray" />
                            </UButton>

                            <!-- Botón de eliminar -->
                            <UButton @click="removeFile(file.id)" color="error" variant="ghost"
                                class="remove-button p-2" title="Eliminar archivo">
                                <UIcon name="i-heroicons-trash" />
                            </UButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>


    </div>
</template>

<script setup lang="ts">
import { UIcon } from '#components'
import type { FileItem } from '~/types/commons/file'
import FileIcon from './FileIcon.vue'
import { useSpinner } from '~/composables/commons/useSpinner'
import ModalPreview from './ModalPreview.vue'

interface Props {
    /** Permite seleccionar múltiples archivos */
    multiple?: boolean
    /** Tamaño máximo de archivo en bytes */
    maxFileSize?: number
    /** Tipos de archivo permitidos */
    acceptedTypes?: string[]
    /** Mensaje personalizado */
    customMessage?: string
    /** Deshabilitar el componente */
    disabled?: boolean
    initialFiles?: FileItem[] | FileItem
    loading?: boolean
}

interface Emits {
    (e: 'files-selected', files: File[]): void
    (e: 'file-added', file: File): void
    (e: 'file-removed', index: number): void
    (e: 'files-cleared'): void
    (e: 'error', message: string): void
}

const props = withDefaults(defineProps<Props>(), {
    multiple: false,
    maxFileSize: 10 * 1024 * 1024, // 10MB por defecto
    acceptedTypes: () => ['.pdf', '.docx', '.xlsx', '.xls', '.doc', '.xlsm', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.rar'],
    customMessage: undefined,
    disabled: false,
    initialFiles: () => [],
    loading: false
})

const emit = defineEmits<Emits>()
const { withSpinner } = useSpinner()

// Referencias
const fileInput = ref<HTMLInputElement | null>(null)

// Estado
const selectedFiles = ref<File[]>([])
const isDragOver = ref(false)
const downloadFileExisting = async (file_url: string | null) => {
    if (!file_url) return

    try {
        await withSpinner(async () => {
            const fileUrl = file_url
            const response = await fetch(fileUrl)

            if (!response.ok) {
                throw new Error(`Error al descargar: ${response.status}`)
            }

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
        showError('Error al descargar archivo')
    }
}

// Inicializar con archivos existentes si los hay
onMounted(() => {

})

// Manejar selección de archivos
const handleSelectFiles = () => {
    fileInput.value?.click()
}

const handleFileInputChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (target.files) {
        const files = Array.from(target.files)
        addFiles(files)
        target.value = ''
    }
}

// Manejar drag over
const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    isDragOver.value = true
}

// Manejar drag leave
const handleDragLeave = (event: DragEvent) => {
    event.preventDefault()
    isDragOver.value = false
}

// Manejar drop
const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    isDragOver.value = false

    if (event.dataTransfer?.files) {
        const files = Array.from(event.dataTransfer.files)
        addFiles(files)
    }
}

// Agregar archivos
const addFiles = (files: File[]) => {
    const validFiles: File[] = []

    files.forEach(file => {
        // Validar tipo de archivo
        if (!isValidFileType(file)) {
            emit('error', `Tipo de archivo no permitido: ${file.name}`)
            return
        }

        // Validar tamaño
        if (file.size > props.maxFileSize!) {
            emit('error', `Archivo demasiado grande: ${file.name} (${formatFileSize(file.size)})`)
            return
        }

        // Validar si ya existe (solo si no es múltiple)
        if (!props.multiple && selectedFiles.value.length > 0) {
            selectedFiles.value = []
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

        // Limpiar archivos seleccionados después de emitir
        selectedFiles.value = []
    }
}

// Validar tipo de archivo
const isValidFileType = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    return props.acceptedTypes!.some(type =>
        type.startsWith('.') ? extension === type : file.type.includes(type)
    )
}

// Obtener clave única para el archivo
const getFileKey = (file: File, index: number): string => {
    return `file-${file.name}-${file.size}-${index}`
}

// Obtener nombre del archivo
const getFileName = (file: File): string => {
    return file.name
}

const removeFile = (index: number) => {

    emit('file-removed', index)

}


// Limpiar todos los archivos

// Exponer métodos para uso externo
defineExpose({
    getFiles: () => selectedFiles.value,
    addFiles,
    removeFile,
    clearSelectedFiles: () => {
        selectedFiles.value = []
    }
})
</script>

<style scoped>
.file-upload-box {
    border: 2px dashed #cccccc;
    padding: 1.5rem;
    border-radius: 10px;
    cursor: pointer;
    transition: border-color 0.3s ease;
}

.file-upload-box:hover {
    border-color: #cccccc;
}

.file-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.file-input {
    display: none;
    /* Oculta el input de archivo por defecto */
}

.file-label {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
}

.file-text {
    font-size: 1rem;
    color: #333333;
}

.file-format {
    font-size: 0.9rem;
    color: #666666;
    margin-bottom: 1rem;
}

.upload-button {
    width: 60%;
    padding: 0.75rem .5rem;
    color: #272A30;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: .75rem;
    transition: background-color 0.3s ease;
}



.file-info-box {
    border: 1px solid #cccccc;
    padding: 1rem;
    border-radius: 10px;
    background-color: #f9f9f9;
    margin-top: 1rem;
    text-align: left;
}

.file-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.file-name {
    font-size: 1rem;
    word-break: break-all;
}

.file-size {
    font-size: 0.9rem;
    color: #666666;
}

/* Lista de archivos seleccionados */
.file-lista {
    margin-top: 20px;
    text-align: left;

}

.file-lista.hidden {
    display: none;
}

.file-lista-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 5px;
    margin-bottom: 10px;
    background-color: #f9f9f9;
}

.file-lista-item svg {
    width: 30px;
    height: 30px;
    margin-right: 10px;
}

.file-lista-item span {
    font-size: 14px;
    color: #333;
    flex-grow: 1;
}


.remove-button {
    background: none;
    border: none;
    cursor: pointer;
    color: #ff4d4d;
    font-size: 1rem;
    transition: color 0.3s ease;
}

.remove-button:hover {
    color: #cc0000;
}

.file-list {
    margin-top: 20px;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
    background-color: #fff;
}

.file-list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
    border-bottom: 1px solid #eee;
}

.file-list-item:last-child {
    border-bottom: none;
}

.file-icon-container {
    display: flex;
    justify-content: space-between;
    width: -webkit-fill-available;
}

.file-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
    margin-bottom: 10px;
    background: #f9f9f9;
}

.file-lista {
    margin-top: 20px;
    text-align: left;
}
</style>
