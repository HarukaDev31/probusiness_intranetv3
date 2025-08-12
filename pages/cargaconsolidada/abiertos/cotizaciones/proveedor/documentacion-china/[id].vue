<template>
    <div class="p-6">
        <!-- Header con botones de navegación -->
        <PageHeader title="Documentación China" subtitle="Gestión de documentos e inspección"
            icon="i-heroicons-document-text" :show-back-button="true" @back="navigateBack">
            <template #actions>
                <UButton label="Guardar" icon="i-heroicons-save" color="warning" @click="saveAll" :loading="saving" />
            </template>
        </PageHeader>

        <!-- Información del consolidado -->
        <ConsolidadoInfo :consolidado="consolidadoInfo" :cliente="clienteInfo" :codigo="codigoProveedor" />

        <!-- Contenido principal -->
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-6">
            <!-- Sección de Documentación -->
            <div class="xl:col-span-4">
                <DocumentacionSection :files="documentosChina" :selected-files="selectedDocumentacionFiles"
                    @files-selected="handleDocumentacionFiles" @download-file="downloadFile"
                    @delete-file="deleteFile" />
            </div>

            <!-- Sección de Inspección -->
            <div class="xl:col-span-5">
                <InspeccionSection :files="inspeccionChina" :selected-files="selectedInspeccionFiles"
                    @files-selected="handleInspeccionFiles" @download-file="downloadFile" @delete-file="deleteFile" />
            </div>

            <!-- Sección de Notas -->
            <div class="xl:col-span-3">
                <NotasSection :model-value="notasChina" @update:model-value="notasChina = $event" @save="saveNotas" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Props
const route = useRoute()
const id = Number(route.params.id)
const { getDocumentosChina, getInspeccionChina, getNotasChina, notasChina, documentosChina, inspeccionChina } = useCotizacionProveedor()
// Estado
const saving = ref(false)
const notas = ref('')

// Datos del consolidado
const consolidadoInfo = ref({
    numero: '#6',
    nombre: 'Consolidado #6'
})

const clienteInfo = ref({
    nombre: 'SARITA VICTORIA CRUZADO SANTAMARIA',
    codigo: 'SACR6'
})

const codigoProveedor = ref('SACR6')

// Archivos
const documentacionFiles = ref([

])

const inspeccionFiles = ref([

])

const selectedDocumentacionFiles = ref<File[]>([])
const selectedInspeccionFiles = ref<File[]>([])

// Métodos
const navigateBack = () => {
    navigateTo('/cargaconsolidada/abiertos/cotizaciones/proveedor')
}

const handleDocumentacionFiles = (files: File[]) => {
    selectedDocumentacionFiles.value = files
}

const handleInspeccionFiles = (files: File[]) => {
    selectedInspeccionFiles.value = files
}

const downloadFile = (url: string | null) => {
    if (url) {
        window.open(url, '_blank')
    }
}

const deleteFile = (id: number) => {
    // Implementar lógica de eliminación
    console.log('Eliminar archivo:', id)
}

const saveNotas = async () => {
    try {
        // Implementar guardado de notas
        console.log('Guardando notas:', notas.value)
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
            // Guardar archivos de documentación
            // Guardar archivos de inspección
        ])

        // Mostrar notificación de éxito
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
        Promise.all([
            getDocumentosChina(id),
            getInspeccionChina(id),
            getNotasChina(id)
        ])
    } catch (error) {
        console.error('Error al cargar datos:', error)
    }
})
</script>