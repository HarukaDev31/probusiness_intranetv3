<template>
    <div class="p-6">
        <PageHeader title="" subtitle="" icon="" :hide-back-button="false"
            @back="navigateTo(`/cargaconsolidada/abiertos/clientes/${cliente?.id_contenedor}`)">
            <template #actions>
                <!--button save-->
                <UButton label="Guardar cambios" color="primary" variant="solid" icon="i-heroicons-arrow-down-tray"
                    size="sm" @click="handleSaveChanges" />
            </template>
        </PageHeader>

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
                                <div
                                    class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                                    <div
                                        class="mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center animate-pulse">
                                        <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                    </div>
                                    <div class="mt-4 space-y-2">
                                        <div
                                            class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto animate-pulse">
                                        </div>
                                        <div
                                            class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto animate-pulse">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="space-y-2">
                                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse"></div>
                                <div
                                    class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                                    <div
                                        class="mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center animate-pulse">
                                        <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                    </div>
                                    <div class="mt-4 space-y-2">
                                        <div
                                            class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto animate-pulse">
                                        </div>
                                        <div
                                            class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto animate-pulse">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="space-y-2">
                                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
                                <div
                                    class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                                    <div
                                        class="mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center animate-pulse">
                                        <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                    </div>
                                    <div class="mt-4 space-y-2">
                                        <div
                                            class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto animate-pulse">
                                        </div>
                                        <div
                                            class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto animate-pulse">
                                        </div>
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
        <div v-else-if="hasData" class="mt-6 ">
            <div class="mb-6  border-gray-200 rounded-lg p-6 border-b-2 border-gray-200">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <span class=" font-semibold">{{ cliente?.nombre }}</span>
                    </div>


                </div>
            </div>
            <!-- Tabs de proveedores -->
            <div v-if="hasProveedores" class="mb-6">
                <UTabs v-model="activeTab" :items="tabs" size="md" variant="pill" class="w-50" color="neutral"
                    @update:model-value="handleTabChange" />
            </div>

            <!-- Información del cliente -->


            <!-- Contenido por proveedor -->
            <div v-if="proveedorActivo" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Sección de Documentación -->
                <UCard class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md col-span-2">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <UIcon name="i-heroicons-folder" class="w-5 h-5 text-gray-500" />
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                                    Documentación {{ currentRole === ROLES.DOCUMENTACION ? 'Perú' : '' }}
                                </h3>
                                <UBadge v-if="hasUnsavedChanges" color="warning" variant="subtle" size="sm">
                                    Cambios sin guardar
                                </UBadge>
                            </div>
                            <div class="flex gap-2">

                                <UButton label="Nuevo Documento" color="warning" variant="solid" icon="i-heroicons-plus"
                                    size="sm" v-if="currentRole === ROLES.COORDINACION || currentId === ID_JEFEVENTAS"
                                    @click="handleNuevoDocumento" />
                            </div>
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
                                    class="w-full" @update:model-value="handleVolumenChange"
                                    :disabled="currentRole === ROLES.DOCUMENTACION" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Valor documento
                                </label>
                                <UInput v-model="proveedorActivo.valor_doc" type="number" placeholder="$ 0"
                                    class="w-full" @update:model-value="handleValorChange"
                                    :disabled="currentRole === ROLES.DOCUMENTACION" />
                            </div>
                        </div>

                        <!-- Área de carga de Factura Comercial -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Factura Comercial
                            </label>
                            <FileUploader :accepted-types="['.xlsx', '.png', '.jpg', '.jpeg']" :immediate="false"
                                :custom-message="'Selecciona o arrastra tu archivo aquí'"
                                :show-remove-button="currentRole === ROLES.COORDINACION" :initial-files="proveedorActivo.factura_comercial ? [{
                                    id: proveedorActivo.id, // debe ser número
                                    file_name: 'Factura Comercial',
                                    file_url: proveedorActivo.factura_comercial,
                                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // tipo MIME si está disponible, si no dejar vacío
                                    size: 0, // tamaño en bytes si está disponible, si no dejar en 0
                                    lastModified: 0, // timestamp si está disponible, si no dejar en 0
                                    file_ext: 'xlsx' // extensión si está disponible, si no dejar vacío
                                }] : []" @files-selected="handleFacturaComercial"
                                @file-removed="handleRemoveFacturaComercial" />
                        </div>

                        <!-- Área de carga de Packing List -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Packing List
                            </label>
                            <FileUploader :accepted-types="['.xlsx', '.png', '.jpg', '.jpeg']"
                                :custom-message="'Selecciona o arrastra tu archivo aquí'" :immediate="false"
                                :show-remove-button="currentRole === ROLES.COORDINACION" :initial-files="proveedorActivo.packing_list ? [{
                                    id: proveedorActivo.id, // debe ser número
                                    file_name: 'Packing List',
                                    file_url: proveedorActivo.packing_list,
                                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // tipo MIME si está disponible, si no dejar vacío
                                    size: 0, // tamaño en bytes si está disponible, si no dejar en 0
                                    lastModified: 0, // timestamp si está disponible, si no dejar en 0
                                    file_ext: 'xlsx' // extensión si está disponible, si no dejar vacío
                                }] : []" @files-selected="handlePackingList" @file-removed="handleRemovePackingList" />
                        </div>

                        <!-- Área de carga de Excel Confirmación -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Excel Confirmación
                            </label>
                            <FileUploader :accepted-types="['.xlsx', '.png', '.jpg', '.jpeg']" :immediate="false"
                                :show-remove-button="currentRole === ROLES.COORDINACION"
                                :custom-message="'Selecciona o arrastra tu archivo aquí'" :initial-files="proveedorActivo.excel_confirmacion ? [{
                                    id: proveedorActivo.id, // debe ser número
                                    file_name: 'Excel Confirmación',
                                    file_url: proveedorActivo.excel_confirmacion,
                                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // tipo MIME si está disponible, si no dejar vacío
                                    size: 0, // tamaño en bytes si está disponible, si no dejar en 0
                                    lastModified: 0, // timestamp si está disponible, si no dejar en 0
                                    file_ext: 'xlsx' // extensión si está disponible, si no dejar vacío
                                }] : []" @files-selected="handleExcelConfirmacion"
                                @file-removed="handleRemoveExcelConfirmacion" />
                        </div>
                        <div v-for="file in files.filter(f => f.id_proveedor === proveedorActivo.id)" :key="file.id">
                            <span>{{ file.folder_name||file.file_name }}</span>
                            <FileUploader :accepted-types="['.xlsx', '.png', '.jpg', '.jpeg']" :immediate="false"
                                :show-remove-button="false" :initial-files="[{
                                    id: file.id,
                                    file_name: file.folder_name||file.file_name,
                                    file_url: file.file_url,
                                    type: file.file_ext,
                                    size: 0,
                                    lastModified: 0,
                                    file_ext: file.file_ext
                                }]" />
                        </div>
                    </div>
                </UCard>
                <UCard class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
                    v-if="currentRole === ROLES.DOCUMENTACION">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <UIcon name="i-heroicons-folder" class="w-5 h-5 text-gray-500" />
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                                    Documentación China
                                </h3>
                                <UBadge v-if="hasUnsavedChanges" color="warning" variant="subtle" size="sm">
                                    Cambios sin guardar
                                </UBadge>
                            </div>
                            <div class="flex gap-2">
                                <UButton v-if="hasUnsavedChanges" label="Guardar cambios" color="primary"
                                    variant="solid" icon="i-heroicons-check" size="sm" @click="handleSaveChanges" />

                            </div>
                        </div>
                    </template>
                    <div class="space-y-4">
                        <div v-for="file in filesAlmacenDocumentacion.filter(f => f.id_proveedor === proveedorActivo.id)"
                            :key="file.id">

                            <FileUploader :accepted-types="['.xlsx', '.png', '.jpg', '.jpeg']" :immediate="false"
                                :show-remove-button="false" :initial-files="[{
                                    id: file.id,
                                    file_name: file.file_name,
                                    file_url: file.file_url,
                                    type: file.file_ext,
                                    size: 0,
                                    lastModified: 0,
                                    file_ext: file.file_ext
                                }]" />
                        </div>

                    </div>

                </UCard>
                <UCard class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
                    v-if="currentRole === ROLES.DOCUMENTACION">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <UIcon name="i-heroicons-folder" class="w-5 h-5 text-gray-500" />
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                                    Inspección
                                </h3>
                                <UBadge v-if="hasUnsavedChanges" color="warning" variant="subtle" size="sm">
                                    Cambios sin guardar
                                </UBadge>
                            </div>
                            <div class="flex gap-2">
                                <UButton v-if="hasUnsavedChanges" label="Guardar cambios" color="primary"
                                    variant="solid" icon="i-heroicons-check" size="sm" @click="handleSaveChanges" />

                            </div>
                        </div>
                    </template>
                    <div class="space-y-4">
                        <div v-for="file in filesAlmacenInspection.filter(f => f.id_proveedor === proveedorActivo.id)"
                            :key="file.id">
                            <FileUploader :accepted-types="['.xlsx', '.png', '.jpg', '.jpeg']" :immediate="false"
                                :show-remove-button="false" :initial-files="[{
                                    id: file.id,
                                    file_name: file.file_name,
                                    file_url: file.file_url,
                                    type: file.file_ext,
                                    size: 0,
                                    lastModified: 0,
                                    file_ext: file.file_ext
                                }]" />
                        </div>

                    </div>

                </UCard>

                <!-- Sección de Cotizaciones -->
                <UCard class="bg-white dark:bg-gray-800 p-6 rounded-lg h-40 shadow-md"
                    v-if="currentRole === ROLES.COORDINACION || currentId === ID_JEFEVENTAS">

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


        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useVariacionCliente } from '~/composables/cargaconsolidada/useVariacionCliente'
import FileUploader from '~/components/commons/FileUploader.vue'
import type { FileItem } from '~/types/commons/file'
import type { id } from '@nuxt/ui/runtime/locale/index.js'
import { ROLES, ID_JEFEVENTAS } from '~/constants/roles'
import { useUserRole } from '~/composables/auth/useUserRole'
const { currentRole, currentId } = useUserRole()
import SimpleUploadFile from '~/components/commons/SimpleUploadFile.vue'
// Composables
const { showSuccess, showError, showConfirmation } = useModal()
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
    filesAlmacenDocumentacion,
    filesAlmacenInspection,
    files,
    getClienteDocumentacion,

    cambiarProveedor,
    updateProveedorDocumentacion,
    updateClienteDocumentacion,
    uploadArchivo,
    deleteArchivo,
    deleteFacturaComercial,
    deletePackingList,
    deleteExcelConfirmacion,
    createProveedorDocumentacion
} = useVariacionCliente()
import { useOverlay } from '#imports'
const overlay = useOverlay()
const simpleUploadFile = overlay.create(SimpleUploadFile)
// Estado local para cambios pendientes
const pendingChanges = ref({
    volumen_doc: null as number | null,
    valor_doc: null as number | null,
    factura_comercial: null as File | null,
    packing_list: null as File | null,
    excel_confirmacion: null as File | null
})

// Estado para controlar si hay cambios sin guardar
const hasUnsavedChanges = computed(() => {
    return pendingChanges.value.volumen_doc !== null ||
        pendingChanges.value.valor_doc !== null ||
        pendingChanges.value.factura_comercial !== null ||
        pendingChanges.value.packing_list !== null ||
        pendingChanges.value.excel_confirmacion !== null
})

// Route
const route = useRoute()
const clienteId = Number(route.params.id)

// Manejadores de tabs
const handleTabChange = async (tabId: string) => {
    await cambiarProveedor(tabId)
}

// Manejadores de campos del proveedor
const handleVolumenChange = (value: number) => {
    pendingChanges.value.volumen_doc = value
}

const handleValorChange = (value: number) => {
    pendingChanges.value.valor_doc = value
}

// Manejadores de archivos
const handleFacturaComercial = (files: File[]) => {
    if (files.length > 0) {
        pendingChanges.value.factura_comercial = files[0]
    }
}

const handleRemoveFacturaComercial = (idProveedor: number) => {

    pendingChanges.value.factura_comercial = null
    showConfirmation(
        'Confirmar eliminación',
        '¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.',
        async () => {
            try {
                await withSpinner(async () => {
                    const result = await deleteFacturaComercial(idProveedor)
                    if (result.success) {
                        showSuccess('Eliminación Exitosa', 'El archivo se ha eliminado correctamente.')
                        await getClienteDocumentacion(clienteId)
                    }
                }, 'Eliminando archivo...')
            } catch (error) {
                console.error('Error al eliminar archivo:', error)
                showError('Error de Eliminación', 'Error al eliminar el archivo')
            }
        }
    )
}

const handlePackingList = (files: File[]) => {
    if (files.length > 0) {
        pendingChanges.value.packing_list = files[0]
    }
}

const handleRemovePackingList = (idProveedor: number) => {
    pendingChanges.value.packing_list = null
    showConfirmation(
        'Confirmar eliminación',
        '¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.',
        async () => {
            try {
                await withSpinner(async () => {
                    const result = await deletePackingList(idProveedor)
                    if (result.success) {
                        showSuccess('Eliminación Exitosa', 'El archivo se ha eliminado correctamente.')
                        await getClienteDocumentacion(clienteId)
                    }
                }, 'Eliminando archivo...')
            } catch (error) {
                console.error('Error al eliminar archivo:', error)
                showError('Error de Eliminación', 'Error al eliminar el archivo')
            }
        }
    )
}

const handleExcelConfirmacion = (files: File[]) => {
    if (files.length > 0) {
        pendingChanges.value.excel_confirmacion = files[0]
    }
}

const handleRemoveExcelConfirmacion = (idProveedor: number) => {
    pendingChanges.value.excel_confirmacion = null
    showConfirmation(
        'Confirmar eliminación',
        '¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.',
        async () => {
            try {
                await withSpinner(async () => {
                    const result = await deleteExcelConfirmacion(idProveedor)
                    if (result.success) {
                        showSuccess('Eliminación Exitosa', 'El archivo se ha eliminado correctamente.')
                        await getClienteDocumentacion(clienteId)
                    }
                }, 'Eliminando archivo...')
            } catch (error) {
                console.error('Error al eliminar archivo:', error)
                showError('Error de Eliminación', 'Error al eliminar el archivo')
            }
        }
    )
}

// Función para guardar todos los cambios
const handleSaveChanges = async () => {
    if (!proveedorActivo.value || !hasUnsavedChanges.value) return

    try {
        await withSpinner(async () => {
            // Preparar FormData con todos los cambios
            const formData = new FormData()

            // Agregar valores si han cambiado
            if (pendingChanges.value.volumen_doc !== null) {
                formData.append('volumen_doc', pendingChanges.value.volumen_doc.toString())
            }
            if (pendingChanges.value.valor_doc !== null) {
                formData.append('valor_doc', pendingChanges.value.valor_doc.toString())
            }

            // Agregar archivos si han cambiado
            if (pendingChanges.value.factura_comercial) {
                formData.append('file_comercial', pendingChanges.value.factura_comercial)
            }
            if (pendingChanges.value.packing_list) {
                formData.append('packing_list', pendingChanges.value.packing_list)
            }
            if (pendingChanges.value.excel_confirmacion) {
                formData.append('excel_confirmacion', pendingChanges.value.excel_confirmacion)
            }

            // Agregar IDs
            formData.append('id', clienteId.toString())
            formData.append('idProveedor', proveedorActivo.value.id.toString())

            // Enviar todos los cambios en una sola petición
            const result = await updateProveedorDocumentacion(proveedorActivo.value.id, formData)

            if (!result.success) {
                throw new Error(result.error || 'Error al guardar los cambios')
            }

            // Limpiar cambios pendientes
            pendingChanges.value = {
                volumen_doc: null,
                valor_doc: null,
                factura_comercial: null,
                packing_list: null,
                excel_confirmacion: null
            }

            // Recargar datos
            await getClienteDocumentacion(clienteId)
            showSuccess('Éxito', 'Todos los cambios se han guardado correctamente')
        }, 'Guardando cambios...')
    } catch (error: any) {
        showError('Error', error.message || 'Error al guardar los cambios')
    }
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
    simpleUploadFile.open({
        title: 'Nuevo Documento',
        withNameField: true,
        onSave: (data: { file: File, name?: string | null }) => {
            /**
             * name
 12
 file
 (binary)
 id_cotizacion
 1031
 id_proveedor
 1429
             */
            const formData = new FormData()
            formData.append('name', data.name)
            formData.append('file', data.file)
            formData.append('id_cotizacion', clienteId.toString())
            formData.append('id_proveedor', proveedorActivo.value.id.toString())
            withSpinner(async () => {
                const result = await createProveedorDocumentacion(formData)
                if (result.success) {
                    showSuccess('Éxito', 'Documento subido correctamente')
                    await getClienteDocumentacion(clienteId)
                } else {
                    showError('Error', 'Error al subir el documento')
                }
            }, 'Subiendo documento...')
        }
    })
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

onMounted(async () => {
    if (clienteId) {
        await getClienteDocumentacion(clienteId)
        // Seleccionar el primer proveedor si existe
        if (proveedores.value && proveedores.value.length > 0) {
            const primerProveedor = proveedores.value[0]
            activeTab.value = primerProveedor.code_supplier
            await cambiarProveedor(primerProveedor.code_supplier)
        }
    }
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
