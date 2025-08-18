<template>
    <div class="p-6">
        <!-- Header con botones de acción -->
        <div class="flex items-center justify-between mb-6">
            <UButton 
                label="Regresar" 
                icon="i-heroicons-arrow-left"
                @click="goBack"
            />
            
            <div class="flex items-center gap-3">
                <UButton 
                    label="Factura General" 
                    variant="outline" 
                    icon="i-heroicons-document"
                    color="neutral"
                />
                <UButton 
                    label="Descargar todo" 
                    variant="outline" 
                    icon="i-heroicons-arrow-down-tray"
                    color="neutral"
                    @click="handleDownloadAll"
                />
                <UButton 
                    label="Nuevo documento +" 
                    variant="solid" 
                    icon="i-heroicons-plus"
                    color="warning"
                    @click="handleNuevoDocumento"
                />
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="mt-6">
            <!-- Skeleton para el grid de folders -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Skeleton para cada folder -->
                <div 
                    v-for="i in 6" 
                    :key="i"
                    class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-pulse"
                >
                    <!-- Header del folder skeleton -->
                    <div class="flex items-center justify-between mb-4">
                        <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                        <div class="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>

                    <!-- FileUploader skeleton -->
                    <div class="space-y-4">
                        <!-- Área de drag & drop skeleton -->
                        <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                            <div class="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
                            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto mb-2"></div>
                            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto"></div>
                        </div>

                        <!-- Botón de upload skeleton -->
                        <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="mt-6">
            <UCard class="bg-red-50 border-red-200">
                <div class="flex items-center gap-2 text-red-800">
                    <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
                    <span>{{ error }}</span>
                </div>
            </UCard>
        </div>

        <!-- Main content - Grid de folders con FileUploader -->
        <div v-else-if="hasData" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Iterar sobre cada folder y crear un FileUploader -->
            <div 
                v-for="folder in foldersByCategoria" 
                :key="folder.id"
                class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md "
            >
                <!-- Header del folder -->
                <div class="flex items-center justify-between mb-4">
                    <h3 
                        class="text-lg font-semibold text-gray-900 dark:text-white px-3 py-1 rounded"
                        
                    >
                        {{ folder.folder_name }}
                    </h3>
                    
                    
                </div>

                <!-- FileUploader para este folder -->
                <FileUploader
                    :accepted-types="acceptedFileTypes"
                    :custom-message="uploadMessage"
                    :initial-files="folder.file_url ? [{
                        id: typeof folder.id === 'number' ? folder.id : 0, // debe ser número
                        file_name: folder.folder_name,
                        file_url: folder.file_url,
                        type: folder.type||'', // tipo MIME si está disponible, si no dejar vacío
                        size: 0, // tamaño en bytes si está disponible, si no dejar en 0
                        lastModified: 0, // timestamp si está disponible, si no dejar en 0
                        file_ext: folder.type||'' // extensión si está disponible, si no dejar vacío
                    }] : undefined"
                       
                    :loading="isFolderLoading(folder.id)"
                    @files-selected="(files) => handleFileUpload(files, folder.id)"
                    @file-removed="(index) => handleFileRemove(index, folder.id)"
                />
                <div v-if="getFolderFiles(folder.id).length > 0" class="mt-4">
                    <div class="space-y-2">
                        <div 
                            v-for="(file, index) in getFolderFiles(folder.id)" 
                            :key="file.id || index"
                            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                            <div class="flex items-center gap-3">
                                <UIcon name="i-heroicons-document" class="w-5 h-5 text-blue-500" />
                                <div>
                                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ file.file_name || file.name }}</p>
                                    <p class="text-xs text-gray-500">{{ formatFileSize(file.size || file.file_size) }}</p>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <UButton
                                    icon="i-heroicons-eye"
                                    variant="ghost"
                                    size="xs"
                                    @click="handleViewFile(file)"
                                />
                                <UButton
                                    icon="i-heroicons-trash"
                                    variant="ghost"
                                    size="xs"
                                    color="error"
                                    @click="handleDeleteFile(file, folder.id)"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Estado vacío -->
        <div v-else class="mt-6">
            <UCard class="bg-gray-50 dark:bg-gray-800">
                <div class="text-center py-8">
                    <UIcon name="i-heroicons-folder" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No hay folders de documentación
                    </h3>
                    <p class="text-gray-500 dark:text-gray-400">
                        No se encontraron folders de documentación para mostrar.
                    </p>
                </div>
            </UCard>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useModal } from '../composables/commons/useModal'
import { useSpinner } from '../composables/commons/useSpinner'
import { useDocumentacion } from '../composables/cargaconsolidada/useDocumentacion'
import FileUploader from '../components/commons/FileUploader.vue'

// Composables
const { showSuccess, showError } = useModal()
const { withSpinner } = useSpinner()
const { 
    folders,
    loading,
    error,
    filters,
    hasData,
    foldersByCategoria,
    getFolders,
    uploadFile,
    deleteFile,
    getFolderFiles,
    isFolderLoading
} = useDocumentacion()

// Route y Router
const route = useRoute()
const router = useRouter()
const contenedorId = route.params.id as string

// Constantes
const acceptedFileTypes = ['.pdf', '.docx', '.xlsx', '.xls', '.doc', '.xlsm', '.csv', '.xlsb', '.xltx', '.xlt']
const uploadMessage = 'Selecciona o arrastra tu archivo aquí'

// Manejadores de archivos
const handleFileUpload = async (files: File[], folderId: string) => {
    if (files.length === 0) return

    try {
        const result = await uploadFile({
            folder_id: folderId,
            file: files[0]
        })
        
        if (result.success) {
            showSuccess('Éxito', 'Archivo subido correctamente')
        } else {
            showError('Error', result.error || 'Error al subir el archivo')
        }
    } catch (err) {
        showError('Error', 'Error inesperado al subir el archivo')
    }
}

const handleFileRemove = (index: number, folderId: string) => {
    console.log('Archivo removido del folder:', folderId, 'índice:', index)
    showSuccess('Éxito', 'Archivo removido de la lista')
}

const handleViewFile = (file: any) => {
    const fileUrl = file.file_url || file.url
    if (fileUrl) {
        window.open(fileUrl, '_blank')
    } else {
        showError('Error', 'No se puede visualizar este archivo')
    }
}

const handleDeleteFile = async (file: any, folderId: string) => {
    try {
        const result = await deleteFile(file.id, folderId)
        
        if (result.success) {
            showSuccess('Éxito', 'Archivo eliminado correctamente')
        } else {
            showError('Error', result.error || 'Error al eliminar el archivo')
        }
    } catch (err) {
        showError('Error', 'Error inesperado al eliminar el archivo')
    }
}

// Manejadores de botones
const handleDownloadAll = async () => {
    try {
        await withSpinner(async () => {
            // Aquí implementarías la lógica para descargar todos los archivos
            console.log('Descargando todos los archivos...')
            await new Promise(resolve => setTimeout(resolve, 2000)) // Simulación
        }, 'Preparando descarga de todos los archivos...')
        
        showSuccess('Éxito', 'Descarga iniciada correctamente')
    } catch (error) {
        showError('Error', 'Error al preparar la descarga')
    }
}

const handleNuevoDocumento = () => {
    console.log('Crear nuevo documento')
    showSuccess('Éxito', 'Funcionalidad de nuevo documento implementada')
}

const goBack = () => {
    navigateTo(`/cargaconsolidada/abiertos/pasos/${contenedorId}`)
}

// Utilidades
const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 B'
    
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

const getFolderTitleClass = (categoria: string): string => {
    switch (categoria) {
        case 'ENVIO':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        case 'COMERCIAL':
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        case 'LEGAL':
            return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
}

// Lifecycle
onMounted(() => {
    if (contenedorId) {
        getFolders(contenedorId)
    }
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
