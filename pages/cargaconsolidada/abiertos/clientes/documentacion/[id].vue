<template>
    <div class="p-6">
        <PageHeader title="Documentación del Cliente" subtitle="Gestión de documentos y cotizaciones"
            icon="i-heroicons-folder" :hide-back-button="false"
            @back="navigateTo(`/cargaconsolidada/abiertos/clientes/${cliente?.id_contenedor}`)"
            />

        <!-- Loading state -->
        <div v-if="loading" class="mt-6">
            <!-- Skeleton para la información del cliente -->
            <UCard class="mb-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="space-y-2">
                        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                        <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                    </div>
                    <div class="space-y-2">
                        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                        <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                    </div>
                    <div class="space-y-2">
                        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                        <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                    </div>
                </div>
            </UCard>

            <!-- Skeleton para los tabs -->
            <div class="mb-6">
                <div class="flex space-x-2">
                    <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded-full w-24 animate-pulse"></div>
                    <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded-full w-24 animate-pulse"></div>
                    <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded-full w-24 animate-pulse"></div>
                </div>
            </div>

            <!-- Skeleton para el contenido principal -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Skeleton para la sección de Documentación -->
                <UCard class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <div class="space-y-6">
                        <!-- Header skeleton -->
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <div class="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
                            </div>
                            <div class="h-9 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                        </div>

                        <!-- Campos skeleton -->
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                                <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                            </div>
                            <div class="space-y-2">
                                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse"></div>
                                <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                            </div>
                        </div>

                        <!-- FileUploader skeletons -->
                        <div class="space-y-4">
                            <div class="space-y-2">
                                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse"></div>
                                <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                                    <div class="mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center animate-pulse">
                                        <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                    </div>
                                    <div class="mt-4 space-y-2">
                                        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto animate-pulse"></div>
                                        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto animate-pulse"></div>
                                    </div>
                                </div>
                            </div>

                            <div class="space-y-2">
                                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse"></div>
                                <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                                    <div class="mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center animate-pulse">
                                        <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                    </div>
                                    <div class="mt-4 space-y-2">
                                        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto animate-pulse"></div>
                                        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto animate-pulse"></div>
                                    </div>
                                </div>
                            </div>

                            <div class="space-y-2">
                                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
                                <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                                    <div class="mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center animate-pulse">
                                        <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                    </div>
                                    <div class="mt-4 space-y-2">
                                        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto animate-pulse"></div>
                                        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </UCard>

                <!-- Skeleton para la sección de Cotizaciones -->
                <UCard class="bg-white dark:bg-gray-800 p-6 rounded-lg h-40 shadow-md">
                    <div class="space-y-4">
                        <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                        <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                    </div>
                </UCard>
            </div>

            <!-- Skeleton para la sección de archivos -->
            <div class="mt-6">
                <UCard class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <div class="space-y-4">
                        <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div class="space-y-3">
                                <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                                <div class="space-y-2">
                                    <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                                    <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                                </div>
                            </div>
                            <div class="space-y-3">
                                <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                                <div class="space-y-2">
                                    <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                                    <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </UCard>
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

        <!-- Main content -->
        <div v-else-if="hasData" class="mt-6">
            <UCard class="mb-6 ">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-blue-800 mb-1">Cliente</label>
                        <span class="text-blue-900 font-semibold">{{ cliente?.nombre }}</span>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-blue-800 mb-1">Documento</label>
                        <span class="text-blue-900">{{ cliente?.documento }}</span>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-blue-800 mb-1">Estado</label>
                        <span class="text-blue-900">{{ cliente?.estado }}</span>
                    </div>
                </div>
            </UCard>
            <!-- Tabs de proveedores -->
            <div v-if="hasProveedores" class="mb-6">
                <UTabs v-model="activeTab" :items="tabs" size="md" variant="pill" class="w-50"
                    @change="handleTabChange" />
            </div>

            <!-- Información del cliente -->


            <!-- Contenido por proveedor -->
            <div v-if="proveedorActivo" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Sección de Documentación -->
                <UCard class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <UIcon name="i-heroicons-folder" class="w-5 h-5 text-gray-500" />
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                                    Documentación - {{ proveedorActivo.code_supplier }}
                                </h3>
                            </div>
                            <UButton label="Nuevo Documento" color="warning" variant="solid" icon="i-heroicons-plus"
                                size="sm" @click="handleNuevoDocumento" />
                        </div>
                    </template>

                    <div class="space-y-4">
                        <!-- Campos de volumen y valor -->
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Volumen documento
                                </label>
                                <UInput v-model="proveedorActivo.volumen_doc" type="number" placeholder="0"
                                    class="w-full" @update:model-value="handleVolumenChange" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Valor documento
                                </label>
                                <UInput v-model="proveedorActivo.valor_doc" type="number" placeholder="$ 0"
                                    class="w-full" @update:model-value="handleValorChange" />
                            </div>
                        </div>

                        <!-- Área de carga de Factura Comercial -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Factura Comercial
                            </label>
                            <FileUploader :accepted-types="['.xlsx', '.png', '.jpg', '.jpeg']"
                                :custom-message="'Selecciona o arrastra tu archivo aquí'"
                                @files-selected="handleFacturaComercial" @file-removed="handleRemoveFacturaComercial" />
                        </div>

                        <!-- Área de carga de Packing List -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Packing List
                            </label>
                            <FileUploader :accepted-types="['.xlsx', '.png', '.jpg', '.jpeg']"
                                :custom-message="'Selecciona o arrastra tu archivo aquí'"
                                @files-selected="handlePackingList" @file-removed="handleRemovePackingList" />
                        </div>

                        <!-- Área de carga de Excel Confirmación -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Excel Confirmación
                            </label>
                            <FileUploader :accepted-types="['.xlsx', '.png', '.jpg', '.jpeg']"
                                :custom-message="'Selecciona o arrastra tu archivo aquí'"
                                @files-selected="handleExcelConfirmacion"
                                @file-removed="handleRemoveExcelConfirmacion" />
                        </div>
                    </div>
                </UCard>

                <!-- Sección de Cotizaciones -->
                <UCard class="bg-white dark:bg-gray-800 p-6 rounded-lg h-40 shadow-md">

                    <div class="space-y-4">


                        <!-- Botón de descarga de cotización inicial -->
                        <UButton label="Descargar cotización inicial" color="neutral" variant="outline"
                            icon="i-heroicons-arrow-down-tray" class="w-full" @click="handleDownloadCotizacionInicial"
                            :disabled="!cliente?.cotizacion_file_url" />

                        <!-- Botón de descarga de cotización final -->
                        <UButton label="Descargar cotización final" color="neutral" variant="outline"
                            icon="i-heroicons-arrow-down-tray" class="w-full" @click="handleDownloadCotizacionFinal"
                            :disabled="!cliente?.cotizacion_final_url" />
                    </div>
                </UCard>
            </div>

            <!-- Archivos del proveedor activo -->
            <div v-if="proveedorActivo && (archivosDocumentacion.length > 0 || archivosInspeccion.length > 0)"
                class="mt-6">
                <UCard class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <template #header>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                            Archivos - {{ proveedorActivo.code_supplier }}
                        </h3>
                    </template>

                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Archivos de Documentación -->
                        <div v-if="archivosDocumentacion.length > 0">
                            <h4 class="font-medium text-gray-700 dark:text-gray-300 mb-3">Documentación</h4>
                            <div class="space-y-2">
                                <div v-for="archivo in archivosDocumentacion" :key="archivo.id"
                                    class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div class="flex items-center gap-3">
                                        <UIcon name="i-heroicons-document" class="w-5 h-5 text-gray-500" />
                                        <div>
                                            <p class="text-sm font-medium text-gray-900 dark:text-white">{{
                                                archivo.file_name }}</p>
                                            <p class="text-xs text-gray-500">{{ archivo.file_ext }}</p>
                                        </div>
                                    </div>
                                    <div class="flex gap-2">
                                        <UButton icon="i-heroicons-arrow-down-tray" variant="ghost" size="xs"
                                            @click="downloadArchivo(archivo.file_url)" />
                                        <UButton icon="i-heroicons-trash" variant="ghost" size="xs" color="error"
                                            @click="deleteArchivo(Number(cliente?.id), archivo.id)" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Archivos de Inspección -->
                        <div v-if="archivosInspeccion.length > 0">
                            <h4 class="font-medium text-gray-700 dark:text-gray-300 mb-3">Inspección</h4>
                            <div class="space-y-2">
                                <div v-for="archivo in archivosInspeccion" :key="archivo.id"
                                    class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div class="flex items-center gap-3">
                                        <UIcon name="i-heroicons-camera" class="w-5 h-5 text-gray-500" />
                                        <div>
                                            <p class="text-sm font-medium text-gray-900 dark:text-white">{{
                                                archivo.file_name }}</p>
                                            <p class="text-xs text-gray-500">{{ archivo.file_ext }}</p>
                                        </div>
                                    </div>
                                    <div class="flex gap-2">
                                        <UButton icon="i-heroicons-arrow-down-tray" variant="ghost" size="xs"
                                            @click="downloadArchivo(archivo.file_url)" />
                                        <UButton icon="i-heroicons-trash" variant="ghost" size="xs" color="error"
                                            @click="deleteArchivo(Number(cliente?.id), archivo.id)" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </UCard>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useModal } from '../composables/commons/useModal'
import { useSpinner } from '../composables/commons/useSpinner'
import { useVariacionCliente } from '../composables/cargaconsolidada/useVariacionCliente'
import FileUploader from '../components/commons/FileUploader.vue'

// Composables
const { showSuccess, showError } = useModal()
const { withSpinner } = useSpinner()
const {
    cliente,
    loading,
    error,
    activeTab,
    tabs,
    proveedores,
    proveedorActivo,
    archivosDocumentacion,
    archivosInspeccion,
    hasData,
    hasProveedores,
    getClienteDocumentacion,
    cambiarProveedor,
    updateProveedorDocumentacion,
    uploadArchivo,
    deleteArchivo
} = useVariacionCliente()

// Route
const route = useRoute()
const clienteId = Number(route.params.id)

// Manejadores de tabs
const handleTabChange = async (tabId: string) => {
    await cambiarProveedor(tabId)
}

// Manejadores de campos del proveedor
const handleVolumenChange = async (value: number) => {
    if (!proveedorActivo.value) return

    const result = await updateProveedorDocumentacion(clienteId, proveedorActivo.value.id, {
        volumen_doc: value
    })

    if (result.success) {
        showSuccess('Éxito', 'Volumen actualizado correctamente')
    } else {
        showError('Error', result.error || 'Error al actualizar el volumen')
    }
}

const handleValorChange = async (value: number) => {
    if (!proveedorActivo.value) return

    const result = await updateProveedorDocumentacion(clienteId, proveedorActivo.value.id, {
        valor_doc: value
    })

    if (result.success) {
        showSuccess('Éxito', 'Valor actualizado correctamente')
    } else {
        showError('Error', result.error || 'Error al actualizar el valor')
    }
}

// Manejadores de archivos
const handleFacturaComercial = async (files: File[]) => {
    if (files.length > 0 && proveedorActivo.value) {
        const result = await uploadArchivo(
            clienteId,
            'factura_comercial',
            files[0],
            proveedorActivo.value.id
        )

        if (result.success) {
            showSuccess('Éxito', 'Factura comercial cargada correctamente')
        } else {
            showError('Error', result.error || 'Error al cargar la factura comercial')
        }
    }
}

const handleRemoveFacturaComercial = (index: number) => {
    console.log('Factura comercial removida:', index)
    showSuccess('Éxito', 'Factura comercial removida')
}

const handlePackingList = async (files: File[]) => {
    if (files.length > 0 && proveedorActivo.value) {
        const result = await uploadArchivo(
            clienteId,
            'packing_list',
            files[0],
            proveedorActivo.value.id
        )

        if (result.success) {
            showSuccess('Éxito', 'Packing list cargado correctamente')
        } else {
            showError('Error', result.error || 'Error al cargar el packing list')
        }
    }
}

const handleRemovePackingList = (index: number) => {
    console.log('Packing list removido:', index)
    showSuccess('Éxito', 'Packing list removido')
}

const handleExcelConfirmacion = async (files: File[]) => {
    if (files.length > 0 && proveedorActivo.value) {
        const result = await uploadArchivo(
            clienteId,
            'excel_confirmacion',
            files[0],
            proveedorActivo.value.id
        )

        if (result.success) {
            showSuccess('Éxito', 'Excel confirmación cargado correctamente')
        } else {
            showError('Error', result.error || 'Error al cargar el excel confirmación')
        }
    }
}

const handleRemoveExcelConfirmacion = (index: number) => {
    console.log('Excel confirmación removido:', index)
    showSuccess('Éxito', 'Excel confirmación removido')
}

// Manejadores de cotizaciones
const handleDownloadCotizacionInicial = async () => {
    if (!cliente.value?.cotizacion_file_url) {
        showError('Error', 'No hay cotización inicial disponible')
        return
    }

    try {
        await withSpinner(async () => {
            const a = document.createElement('a')
            a.href = cliente.value!.cotizacion_file_url!
            a.download = 'cotizacion_inicial'
            a.target = '_blank'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        }, 'Descargando cotización inicial...')

        showSuccess('Éxito', 'Cotización inicial descargada correctamente')
    } catch (error) {
        showError('Error', 'Error al descargar la cotización inicial')
    }
}

const handleDownloadCotizacionFinal = async () => {
    if (!cliente.value?.cotizacion_final_url) {
        showError('Error', 'No hay cotización final disponible')
        return
    }

    try {
        await withSpinner(async () => {
            const a = document.createElement('a')
            a.href = cliente.value!.cotizacion_final_url!
            a.download = 'cotizacion_final'
            a.target = '_blank'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        }, 'Descargando cotización final...')

        showSuccess('Éxito', 'Cotización final descargada correctamente')
    } catch (error) {
        showError('Error', 'Error al descargar la cotización final')
    }
}

// Manejador del botón nuevo documento
const handleNuevoDocumento = () => {
    console.log('Crear nuevo documento')
    showSuccess('Éxito', 'Funcionalidad de nuevo documento implementada')
}

// Descargar archivo
const downloadArchivo = async (fileUrl: string) => {
    try {
        await withSpinner(async () => {
            const a = document.createElement('a')
            a.href = fileUrl
            a.download = 'archivo'
            a.target = '_blank'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        }, 'Descargando archivo...')

        showSuccess('Éxito', 'Archivo descargado correctamente')
    } catch (error) {
        showError('Error', 'Error al descargar el archivo')
    }
}

// Lifecycle
onMounted(() => {
    if (clienteId) {
        getClienteDocumentacion(clienteId)
    }
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
