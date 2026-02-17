<template>
    <div class="p-6">
        <!-- Header con botones de navegación -->
        <PageHeader title="Documentación China" subtitle="Gestión de documentos e inspección"
            icon="i-heroicons-document-text" :show-back-button="true" @back="navigateBack">
            <template #actions>
                <UButton label="Guardar" icon="material-symbols:save" color="warning" @click="saveAll" :loading="saving" />
            </template>
        </PageHeader>

        <!-- Información del consolidado -->
        <ConsolidadoInfo :consolidado="consolidadoInfo" :cliente="clienteInfo" :codigoProveedor="codigoProveedor"
            :loading="loadingInfo" />

        <!-- Contenido principal -->
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-6">
            <!-- Sección de Documentación -->
            <div class="xl:col-span-4">
                <DocumentacionSection :loading="loadingDocumentacion" :files="documentosChina" :disabled="true"
                    :selected-files="selectedDocumentacionFiles" @files-selected="handleDocumentacionFiles"
                    @download-file="downloadFile" @delete-file="deleteFileDocumentacion" />
            </div>

            <!-- Sección de Inspección -->
            <div class="xl:col-span-5">
                <InspeccionSection :loading="loadingInspeccion" :files="inspeccionChina" :disabled="true"
                    :selected-files="selectedInspeccionFiles" @files-selected="handleInspeccionFiles"
                    @download-file="downloadFile" @delete-file="deleteFileInspeccion"
                    @file-removed="deleteFileInspeccion" />
            </div>

            <!-- Sección de Notas -->
            <div class="xl:col-span-3">
                <NotasSection :loading="loadingNotas" :model-value="notasChina" :disabled="true"
                    @update:model-value="notasChina = $event" 
                    />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCotizacionProveedor } from '~/composables/cargaconsolidada/useCotizacionProveedor'
// Props
const route = useRoute()
const id = Number(route.params.id)
const { getDocumentosChina,
    getInspeccionChina,
    saveNotasChina,
    deleteDocumentosChina,
    deleteInspeccionChina,
    getNotasChina,
    saveDocumentosChina,
    saveInspeccionChina,
    notasChina,
    documentosChina,
    inspeccionChina,
    proveedor,
    getProveedorById } = useCotizacionProveedor()
// Estado
const saving = ref(false)
const notas = ref('')
const loadingInfo = ref(false)
const loadingDocumentacion = ref(false)
const loadingInspeccion = ref(false)
const loadingNotas = ref(false)
const consolidadoInfo = ref({
    numero: '',
})
import { useSpinner } from '~/composables/commons/useSpinner'
const { withSpinner } = useSpinner()
import { useModal } from '~/composables/commons/useModal'
const { showSuccess, showError, showConfirmation } = useModal()
const clienteInfo = ref({
    nombre: '',
})
const codigoProveedor = ref('')

const selectedDocumentacionFiles = ref<File[]>([])
const selectedInspeccionFiles = ref<File[]>([])

// Métodos
const navigateBack = () => {
    navigateTo('/cargaconsolidada/coordinacion/completados/cotizaciones/proveedor')
}

const handleDocumentacionFiles = async (files: File[]) => {
    selectedDocumentacionFiles.value = files
    const data = {
        id_proveedor: id,
        id_cotizacion: proveedor.value.id_cotizacion,
        files: files
    }
    loadingDocumentacion.value = true
    await saveDocumentosChina(data)
    loadingDocumentacion.value = false
    await getDocumentosChina(id)

    selectedDocumentacionFiles.value = []
}

const handleInspeccionFiles = async (files: File[]) => {
    selectedInspeccionFiles.value = files
    const data = {
        id_proveedor: id,
        id_cotizacion: proveedor.value.id_cotizacion,
        files: files
    }
    loadingInspeccion.value = true
    await saveInspeccionChina(data)
    await getInspeccionChina(id)
    loadingInspeccion.value = false

}

const downloadFile = (url: string | null) => {
    if (url) {
        window.open(url, '_blank')
    }
}
const deleteFileDocumentacion = async (idDocumento: number) => {
    showConfirmation('Eliminar archivo', '¿Estás seguro de querer eliminar este archivo?', async () => {
        await withSpinner(async () => {
            const response = await deleteDocumentosChina(idDocumento)
            
            if (response?.success) {
                showSuccess('Éxito', 'Archivo eliminado correctamente')
            } else {
                showError('Error', 'Error al eliminar el archivo')
            }
        }, 'Eliminando archivo...')
        loadingDocumentacion.value = true
        await getDocumentosChina(id)
        loadingDocumentacion.value = false
    }, () => {
        
    })

}
const deleteFileInspeccion = async (idInspeccion: number) => {
    showConfirmation('Eliminar archivo', '¿Estás seguro de querer eliminar este archivo?', async () => {
        await withSpinner(async () => {
            await deleteInspeccionChina(idInspeccion)
        }, 'Eliminando archivo...')
        loadingInspeccion.value = true
        await getInspeccionChina(id)
        loadingInspeccion.value = false
    }, () => {
        
    })

}

const saveNotas = async () => {
    try {
        const data = {
            id_proveedor: id,
            id_cotizacion: proveedor.value.id_cotizacion,
            notas: notasChina.value
        }
        await saveNotasChina(data)
        await getNotasChina(id)
    } catch (error) {
        console.error('Error al guardar notas:', error)
    }
}

const saveAll = async () => {
    saving.value = true
    try {
        // Guardar todo
        await Promise.all([
            saveNotas(),

        ])

        const { showSuccess } = useNotifications()
        showSuccess({ title: 'Éxito', message: 'Documentación guardada correctamente' })
    } catch (error) {
        console.error('Error al guardar:', error)
    } finally {
        saving.value = false
    }
}

onMounted(async () => {
    // Cargar datos del consolidado
    try {
        loadingInfo.value = true
        loadingDocumentacion.value = true
        loadingInspeccion.value = true
        loadingNotas.value = true
        await getDocumentosChina(id)
        loadingDocumentacion.value = false
        await getInspeccionChina(id)
        loadingInspeccion.value = false
        await getNotasChina(id)
        loadingNotas.value = false
        await getProveedorById(id)
        codigoProveedor.value = proveedor.value.code_supplier
        clienteInfo.value.nombre = proveedor.value.supplier
        consolidadoInfo.value.numero = `#${proveedor.value?.contenedor?.carga}`
        loadingInfo.value = false
    } catch (error) {
        console.error('Error al cargar datos:', error)
    }
})
</script>