<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" @click="closeModal">
        <div class="relative max-w-4xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-xl" @click.stop>
            <!-- Close button -->
            <UButton 
                icon="i-heroicons-x-mark" 
                variant="ghost" 
                size="sm"
                class="absolute top-4 right-4 z-10 bg-white dark:bg-gray-800 rounded-full shadow-lg"
                @click="closeModal" 
            />
            
            <!-- Document container -->
            <div class="p-6">
                <!-- Header -->
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                            {{ documentName }}
                        </h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            {{ fileExtension }} • {{ fileSize }}
                        </p>
                    </div>
                    <UButton
                        icon="i-heroicons-arrow-down-tray"
                        variant="outline"
                        @click="downloadDocument"
                        class="ml-4"
                    >
                        Descargar
                    </UButton>
                </div>

                <!-- Document preview -->
                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                    <!-- PDF Preview -->
                    <div v-if="isPdf" class="w-full h-96">
                        <iframe 
                            :src="documentUrl" 
                            class="w-full h-full border-0 rounded"
                            title="Vista previa del documento"
                        ></iframe>
                    </div>
                    
                    <!-- Image Preview -->
                    <div v-else-if="isImage" class="flex justify-center">
                        <img 
                            :src="documentUrl" 
                            :alt="documentName"
                            class="max-w-full max-h-96 object-contain rounded"
                        />
                    </div>
                    
                    <!-- Text Preview -->
                    <div v-else-if="isText" class="w-full h-96 overflow-auto">
                        <pre class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ textContent }}</pre>
                    </div>
                    
                    <!-- Default Preview -->
                    <div v-else class="flex flex-col items-center justify-center h-96 text-gray-500 dark:text-gray-400">
                        <UIcon 
                            name="i-heroicons-document" 
                            class="w-16 h-16 mb-4"
                        />
                        <p class="text-lg font-medium mb-2">Vista previa no disponible</p>
                        <p class="text-sm">Este tipo de archivo no puede ser previsualizado</p>
                        <UButton
                            icon="i-heroicons-arrow-down-tray"
                            variant="outline"
                            @click="downloadDocument"
                            class="mt-4"
                        >
                            Descargar archivo
                        </UButton>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
    isOpen: boolean
    documentUrl: string
    documentName?: string
    fileExtension?: string
    fileSize?: string
}

interface Emits {
    (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
    documentName: 'Documento',
    fileExtension: 'FILE',
    fileSize: '0 KB'
})

const emit = defineEmits<Emits>()

// Computed properties
const isPdf = computed(() => props.fileExtension?.toLowerCase() === 'pdf')
const isImage = computed(() => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
    return imageExtensions.includes(props.fileExtension?.toLowerCase() || '')
})
const isText = computed(() => {
    const textExtensions = ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts']
    return textExtensions.includes(props.fileExtension?.toLowerCase() || '')
})

// Text content for text files
const textContent = ref('')

// Methods
const closeModal = () => {
    emit('close')
}

const downloadDocument = () => {
    const link = document.createElement('a')
    link.href = props.documentUrl
    link.download = props.documentName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

// Load text content when modal opens
watch(() => props.isOpen, async (newValue) => {
    if (newValue && isText.value) {
        try {
            const response = await fetch(props.documentUrl)
            textContent.value = await response.text()
        } catch (error) {
            textContent.value = 'Error al cargar el contenido del archivo'
        }
    }
})
</script> 