<template>
    <UModal :modelValue="true" @close="$emit('close')">
        <template #header>
            <h2 class="text-xl font-semibold">{{ props.title }}</h2>
        </template>
        <template #body>
            <div class="p-6 space-y-6">


                <div class="space-y-4">
                    <!-- Uploader -->
                    <div>
                        <FileUploader ref="fileUploaderRef" :multiple="props.multiple??false" @file-added="handleFileAdded"
                            @file-removed="handleFileRemoved" />
                    </div>
                    
                   
                </div>
            </div>
        </template>
        <template #footer>
            <div class="flex justify-end gap-3 mt-6">
                <UButton color="neutral" variant="soft" @click="$emit('close')">
                    Cancelar
                </UButton>
                <UButton color="primary" :disabled="!isValid" @click="handleSave">
                    Guardar
                </UButton>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import FileUploader from '~/components/commons/FileUploader.vue'

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'save', data: { file?: File, files?: File[] }): void
}>()

interface Props {
    title: string
    multiple?: boolean
}
const props = withDefaults(defineProps<Props>(), {
    title: 'Subir archivo',
    multiple: false
})

const selectedFile = ref<File | null>(null)
const selectedFiles = ref<File[]>([])
const fileUploaderRef = ref<InstanceType<typeof FileUploader> | null>(null)

// Validación
const isValid = computed(() => {
    if (props.multiple) {
        return selectedFiles.value.length > 0
    }
    return selectedFile.value !== null
})

// Manejadores de eventos
const handleFileAdded = (file: File) => {
    if (props.multiple) {
        // Evitar duplicados
        if (!selectedFiles.value.some(f => f.name === file.name && f.size === file.size)) {
            selectedFiles.value.push(file)
        }
    } else {
        selectedFile.value = file
    }
}

const handleFileRemoved = (index?: number) => {
    if (props.multiple) {
        if (index !== undefined) {
            selectedFiles.value.splice(index, 1)
        } else {
            selectedFiles.value = []
        }
    } else {
        selectedFile.value = null
    }
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const handleSave = () => {
    if (!isValid.value) return

    if (props.multiple) {
        if (selectedFiles.value.length === 0) return
        emit('save', {
            files: selectedFiles.value
        })
    } else {
        if (!selectedFile.value) return
        emit('save', {
            file: selectedFile.value
        })
    }
}
</script>
