<template>
    <UModal :modelValue="true" @close="$emit('close')">
        <template #header>
            <h2 class="text-xl font-semibold">Facturas Comerciales</h2>
        </template>
        <template #body>
            <div class="p-6">
                <FileUploader 
                    ref="fileUploaderRef"
                    :initial-files="facturasFiles"
                    :multiple="true"
                    :disabled="false"
                    :show-remove-button="true"
                    :immediate="false"
                    @file-removed="handleFileRemoved"
                    @files-selected="handleFilesSelected"
                />
            </div>
        </template>
        <template #footer>
            <div class="flex justify-end gap-3 mt-6">
                <UButton color="neutral" variant="soft" @click="handleClose">
                    Cerrar
                </UButton>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import FileUploader from '~/components/commons/FileUploader.vue'
import type { FileItem } from '~/types/commons/file'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'

interface FacturaComercial {
    id: number
    quotation_id: number
    file_name: string
    file_path: string
    size: number
    mime_type: string
    created_at: string
}

interface Props {
    facturas?: FacturaComercial[]
    idCotizacion?: number
    onClose?: () => void
    onDelete?: (id: number) => void
    onUpload?: (files: File[], idCotizacion: number) => Promise<void>
    onRefresh?: (idCotizacion: number) => Promise<FacturaComercial[]>
}

const props = withDefaults(defineProps<Props>(), {
    facturas: () => [],
    idCotizacion: undefined,
    onClose: undefined,
    onDelete: undefined,
    onUpload: undefined,
    onRefresh: undefined
})

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'delete', id: number): void
    (e: 'upload', files: File[]): void
    (e: 'refresh', facturas: FacturaComercial[]): void
}>()

const { withSpinner } = useSpinner()
const { showSuccess, showError } = useModal()
const fileUploaderRef = ref<InstanceType<typeof FileUploader> | null>(null)

// Convertir las facturas al formato FileItem que espera FileUploader
const facturasFiles = computed<FileItem[]>(() => {
    if (!props.facturas || props.facturas.length === 0) return []
    
    return props.facturas.map(factura => {
        // Construir la URL completa del archivo
        const config = useRuntimeConfig()
        const baseUrl = config.public.apiBaseUrl || ''
        // El file_path ya incluye la ruta completa desde storage/app
        // Necesitamos construir la URL correcta para acceder al archivo
        const fileUrl = `${baseUrl.replace('/api', '')}/storage/${factura.file_path}`
        
        return {
            id: factura.id,
            file_name: factura.file_name,
            file_url: fileUrl,
            type: factura.mime_type,
            size: factura.size,
            lastModified: new Date(factura.created_at).getTime(),
            file_ext: factura.file_name.split('.').pop() || ''
        }
    })
})

const handleFileRemoved = (id: number) => {
    emit('delete', id)
}

const handleFilesSelected = async (files: File[]) => {
    if (!files || files.length === 0) return
    if (!props.idCotizacion) {
        showError('Error: No se especificó la cotización', 'error')
        return
    }

    if (props.onUpload) {
        await props.onUpload(files, props.idCotizacion!)
    } else {
        emit('upload', files)
    }
    
    // Limpiar archivos seleccionados después de subir
    if (fileUploaderRef.value) {
        fileUploaderRef.value.clearSelectedFiles()
    }
}

const handleClose = () => {
    emit('close')
}
</script>

