<template>
    <div>
        <!-- Document preview cards -->
        <div v-if="documents && documents.length > 0" class="flex gap-2 overflow-x-auto">
            <div 
                v-for="(document, index) in documents" 
                :key="index"
                class="relative group cursor-pointer flex-shrink-0"
                @click="openDocumentModal(document, getFileExtension(document))"
            >
                <div class="w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors flex items-center justify-center">
                    <UIcon 
                        name="i-heroicons-document" 
                        class="w-8 h-8 text-gray-500 dark:text-gray-400"
                    />
                </div>
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center">
                    <UIcon 
                        name="i-heroicons-eye" 
                        class="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                </div>
                <div class="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded">
                    {{ getFileExtension(document) }}
                </div>
            </div>
        </div>
        
        <!-- Media documents -->
        <div v-if="media && media.length > 0" class="flex gap-2 overflow-x-auto">
            <div 
                v-for="(document, index) in media" 
                :key="`media-${index}`"
                class="relative group cursor-pointer flex-shrink-0"
                @click="openDocumentModal(document.ruta, document.extension?.toUpperCase() || 'FILE', document.nombre_original, document.peso)"
            >
                <div class="w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors flex items-center justify-center">
                    <UIcon 
                        name="i-heroicons-document" 
                        class="w-8 h-8 text-gray-500 dark:text-gray-400"
                    />
                </div>
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center">
                    <UIcon 
                        name="i-heroicons-eye" 
                        class="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                </div>
                <div class="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded">
                    {{ document.extension?.toUpperCase() || 'FILE' }}
                </div>
            </div>
        </div>
        
        <!-- No documents message -->
        <span v-if="(!documents || documents.length === 0) && (!media || media.length === 0)" class="text-gray-500 dark:text-gray-400 text-sm">
            Sin documentos
        </span>

        <!-- Document Modal -->
        <DocumentModal 
            :is-open="showModal"
            :document-url="selectedDocumentUrl"
            :document-name="selectedDocumentName"
            :file-extension="selectedFileExtension"
            :file-size="selectedFileSize"
            @close="closeModal"
        />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DocumentModal from './DocumentModal.vue'

interface MediaDocument {
    id: number
    id_regulacion: number
    extension: string
    peso: number
    nombre_original: string
    ruta: string
    created_at: string
    updated_at: string
}

interface Props {
    documents?: string[]
    media?: MediaDocument[]
}

const props = defineProps<Props>()

// Modal state
const showModal = ref(false)
const selectedDocumentUrl = ref('')
const selectedDocumentName = ref('')
const selectedFileExtension = ref('')
const selectedFileSize = ref('')

// Methods
const getFileExtension = (filePath: string): string => {
    const extension = filePath.split('.').pop()?.toUpperCase() || 'FILE'
    return extension
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const openDocumentModal = (documentUrl: string, extension: string, name?: string, size?: number) => {
    const config = useRuntimeConfig()
    selectedDocumentUrl.value = `${config.public.apiBaseUrl}${documentUrl}`
    selectedDocumentName.value = name || `Documento.${extension.toLowerCase()}`
    selectedFileExtension.value = extension
    selectedFileSize.value = size ? formatFileSize(size) : '0 KB'
    showModal.value = true
}

const closeModal = () => {
    showModal.value = false
    selectedDocumentUrl.value = ''
    selectedDocumentName.value = ''
    selectedFileExtension.value = ''
    selectedFileSize.value = ''
}
</script> 