<template>
    <UModal :title="'Crear Prospecto'" @close="handleClose">
        <template #body>
            <div class="space-y-4">
                <FileUploader :multiple="false" :maxFileSize="10 * 1024 * 1024"
                    :acceptedTypes="['.xlsx', '.xls', '.xlsm']" @files-selected="handleFileSelected"
                    @error="handleError" />
            </div>
        </template>
        <template #footer=>
            <div class="flex justify-end space-x-2">
                <UButton color="neutral" variant="soft" @click="handleClose">
                    Cancelar
                </UButton>
                <UButton color="primary" :loading="loading" :disabled="!selectedFile" @click="handleSubmit">
                    Guardar
                </UButton>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FileUploader from '@/components/commons/FileUploader.vue'
import { useCotizacion } from '@/composables/cargaconsolidada/useCotizacion'
import { useSpinner } from '@/composables/commons/useSpinner'
import { useModal } from '@/composables/commons/useModal'
const { createProspecto, updateCotizacion } = useCotizacion()

const props = defineProps<{
    idCotizacion: number | null
    idConsolidado: number | null
}>()
const emit = defineEmits<{
    (e: 'close'): void
    (e: 'success'): void
}>()
const { showSuccess, showError } = useModal()
const loading = ref(false)
const selectedFile = ref<File | null>(null)
const { withSpinner } = useSpinner()
const handleFileSelected = (files: File[]) => {
    console.log(files)
    if (files.length > 0) {
        selectedFile.value = files[0]
    }
}

const handleError = (message: string) => {
    showError(message, 'Error al procesar el archivo')
}

const handleClose = () => {
    selectedFile.value = null
    emit('close')
}

const handleSubmit = async () => {
    if (!selectedFile.value) return

    try {
        loading.value = true
        const data: any = {
            file: selectedFile.value
        }
        if (props.idCotizacion) {
            data.id_cotizacion = props.idCotizacion
        } else {
            data.id_contenedor = props.idConsolidado
        }
        console.log(data)
        await withSpinner(async () => {
            let response: any
            if (props.idCotizacion) {
                response = await updateCotizacion(props.idCotizacion, data)
            } else {
                response = await createProspecto(data)
            }
            if (response.success) {
                showSuccess('Prospecto creado correctamente', 'El prospecto se ha creado correctamente')
                emit('success')
                handleClose()
            } else {
                showError('Error al crear el prospecto', 'El prospecto no se ha creado correctamente')
            }
        }, 'Creando prospecto...')

    } catch (error) {
        showError('Error al procesar el archivo', 'El archivo no se ha procesado correctamente')
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
/* Los estilos son manejados por los componentes base */
</style>
