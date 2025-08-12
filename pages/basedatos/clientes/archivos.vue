<template>
    <div class="p-6">
        
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center">
                <UButton label="Regresar" color="neutral" variant="outline" icon="i-heroicons-arrow-left"
                    @click="goBack" />
            </div>
            <div class="flex items-center gap-3">
                <!-- Botón de subir archivo (existente) -->
                <UModal v-model="showCreateModal">

                    <template #header>
                        <div class="flex items-center justify-between">
                            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                                Importar Base de Datos de Clientes
                            </h3>
                            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1"
                                @click="showCreateModal = false" />
                        </div>
                    </template>
                    <template #body>
                        <div class="space-y-4">
                            <!-- Información -->
                            <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
                                <p class="text-sm text-blue-800 dark:text-blue-200">
                                    <strong>Nota:</strong> Seleccione un archivo Excel (.xlsx) o CSV (.csv) con la base
                                    de datos de clientes que desea importar.
                                </p>
                            </div>



                            <!-- UFileUpload Component -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Archivo de clientes *
                                </label>
                                <UFileUpload
                                    v-model="selectedFile"
                                    accept=".xlsx,.xls,.csv"
                                    :multiple="false"
                                    label="Arrastra tu archivo aquí o haz clic para seleccionar"
                                    description="Excel (.xlsx, .xls) o CSV (.csv) - Máximo 10MB"
                                    icon="i-heroicons-document-arrow-up"
                                    color="primary"
                                    variant="area"
                                    size="lg"
                                    :highlight="!!fileError"
                                    class="w-full min-h-48"
                                    @update:model-value="handleFileSelect"
                                >
                                    <!-- Slot personalizado para mostrar información del archivo -->
                                    <template #actions>
                                        <div v-if="selectedFile && !fileError" class="w-full">
                                            <div class="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                                <div class="flex items-center">
                                                    <UIcon name="i-heroicons-document-check"
                                                        class="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                                                    <div>
                                                        <span class="text-sm font-medium text-green-800 dark:text-green-200">
                                                            {{ selectedFile.name }}
                                                        </span>
                                                        <p class="text-xs text-green-600 dark:text-green-400">
                                                            Tamaño: {{ formatFileSize(selectedFile.size) }}
                                                        </p>
                                                    </div>
                                                </div>
                                                <UButton 
                                                    size="xs" 
                                                    color="error" 
                                                    variant="ghost" 
                                                    icon="i-heroicons-x-mark"
                                                    @click="removeFile" 
                                                />
                                            </div>
                                        </div>
                                    </template>
                                </UFileUpload>
                                
                                                                 <!-- Error de archivo -->
                                 <div v-if="fileError" class="mt-2 text-sm text-red-600 dark:text-red-400">
                                     {{ fileError }}
                                 </div>

                                 
                             </div>

                            <!-- Información adicional -->
                            <div class="text-sm text-gray-600 dark:text-gray-400">
                                <p class="mb-2"><strong>Formato esperado del archivo:</strong></p>
                                <ul class="list-disc list-inside space-y-1 ml-2">
                                    <li>Columna A: Nombre completo</li>
                                    <li>Columna B: DNI/RUC</li>
                                    <li>Columna C: Correo electrónico</li>
                                    <li>Columna D: WhatsApp</li>
                                    <li>Columna E: Servicio (Consolidado/Curso)</li>
                                    <li>Columna F: Fecha (opcional)</li>
                                </ul>
                            </div>
                        </div>
                    </template>
                    <template #footer="{ close }">
                        <div class="flex justify-end gap-3">
                            <UButton color="neutral" variant="outline" @click="showCreateModal = false"
                                :disabled="uploadLoading">
                                Cancelar
                            </UButton>
                            <UButton color="primary" @click="()=>{
                                close()
                                handleFileUpload()
                            }" :loading="uploadLoading"
                                :disabled="uploadLoading || !selectedFile">
                                Importar Excel
                            </UButton>
                        </div>
                    </template>


                                         <UButton label="Importar Excel de Clientes" icon="i-heroicons-arrow-up-tray" color="neutral"
                         variant="outline" @click="showCreateModal = true" />
                 </UModal>

            </div>
        </div>

        <!-- Data Table -->
        <UCard>
            <div class="overflow-x-auto">
                <UTable :data="archivos" :columns="columns" class="w-full">
                    <template #loading-state>
                        <div class="flex items-center justify-center py-8">
                            <UIcon name="i-heroicons-arrow-path" class="animate-spin w-6 h-6 mr-2" />
                            <span>Cargando...</span>
                        </div>
                    </template>

                    <template #empty-state>
                        <div class="text-center py-8">
                            <UIcon name="i-heroicons-inbox" class="mx-auto h-12 w-12 text-gray-400" />
                            <h3 class="mt-2 text-sm font-semibold text-gray-900">No hay archivos</h3>
                            <p class="mt-1 text-sm text-gray-500">
                                No se encontraron archivos de clientes.
                            </p>
                        </div>
                    </template>
                </UTable>
            </div>
        </UCard>



    </div>
</template>

<script setup lang="ts">
import { ref, h, resolveComponent, onMounted } from 'vue'
import type { TableColumn } from '@nuxt/ui'

// Components
const UButton = resolveComponent('UButton')

// State
const showCreateModal = ref(false)
const selectedFile = ref<File | null>(null)
const fileError = ref('')
const uploadLoading = ref(false)
const createLoading = ref(false)

const { clienteService } = await import('~/services/clienteService')
const { showSuccess, showError } = useModal()
const { withSpinner } = useSpinner()

const newArchivo = ref({
    nombre: '',
    descripcion: ''
})

// Datos de archivos importados
const archivos = ref<{
    id: number
    nombre_archivo: string
    cantidad_rows: number
    estadisticas: any
    created_at: string
    ruta_archivo: string
}[]>([])

// Configuración de columnas para la tabla
const columns: TableColumn<any>[] = [
    {
        accessorKey: 'id',
        header: 'N.',
        cell: ({ row }) => {
            const index = archivos.value.indexOf(row.original)
            return index + 1
        }
    },
    {
        accessorKey: 'nombre_archivo',
        header: 'Nombre del archivo',
        cell: ({ row }) => row.getValue('nombre_archivo')
    },
    {
        accessorKey: 'created_at',
        header: 'Fecha de importación',
        cell: ({ row }) => {
            const fecha = new Date(row.getValue('created_at'))
            return fecha.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        }
    },
    {
        accessorKey: 'cantidad_rows',
        header: 'Registros importados',
        cell: ({ row }) =>{
            return h('div', { class: 'flex  flex-col items-center gap-2' }, [
                h('span', { class: 'text-sm font-medium text-gray-800 dark:text-gray-200' }, row.getValue('cantidad_rows')),
                h('span', { class: 'text-xs text-gray-600 dark:text-gray-400' }, row.original.estadisticas.creados+' clientes creados'),
                h('span', { class: 'text-xs text-gray-600 dark:text-gray-400' }, row.original.estadisticas.actualizados+' clientes actualizados'),
                h('span', { class: 'text-xs text-gray-600 dark:text-gray-400' }, (row.original.estadisticas.total - (row.original.estadisticas.creados + row.original.estadisticas.actualizados))  +' clientes con errores')
            ])
        }
    },
    {
        accessorKey: 'excel',
        header: 'Descargar',
        cell: ({ row }) => {
            return h('div', { class: 'flex justify-center' }, [
                h('div', {
                    class: 'w-8 h-8 bg-green-500 rounded flex items-center justify-center cursor-pointer hover:bg-green-600 transition-colors',
                    onClick: () => handleDownloadExcel(row.original.id, row.original.ruta_archivo)
                }, [
                    h('span', {
                        class: 'text-white font-bold text-sm'
                    }, '↓')
                ])
            ])
        }
    },
    {
        accessorKey: 'accion',
        header: 'Acción',
        cell: ({ row }) => {
            return h('div', { class: 'flex justify-center' }, [
                h(UButton, {
                    size: 'xs',
                    icon: 'i-heroicons-trash',
                    color: 'error',
                    variant: 'ghost',
                    onClick: () => handleDeleteArchivo(row.original.id)
                })
            ])
        }
    }
]

// Methods
const goBack = () => {
    navigateTo('/basedatos/clientes')
}

const handleFileSelect = (...args: any[]) => {
    const file = args[0] as File | null
    
    if (file) {
        fileError.value = ''
        const isValid = validateFile(file)

        if (isValid) {
            selectedFile.value = file
        } else {
            selectedFile.value = null
        }
    } else {
        selectedFile.value = null
        fileError.value = ''
    }
}

const validateFile = (file: File): boolean => {
    const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
        'application/vnd.ms-excel.sheet.macroEnabled.12'
    ]

    const maxSize = 100 * 1024 * 1024 // 100MB

    if (!allowedTypes.includes(file.type)) {
        fileError.value = 'Solo se permiten archivos Excel (.xlsx, .xls) o CSV (.csv)'
        return false
    }

    if (file.size > maxSize) {
        fileError.value = 'El archivo no puede ser mayor a 10MB'
        return false
    }

    return true
}

const removeFile = () => {
    selectedFile.value = null
    fileError.value = ''
    // El UFileUpload maneja automáticamente la eliminación visual del archivo
}





const handleFileUpload = async () => {
    if (!selectedFile.value) return

    try {
        await withSpinner(async () => {
            // Importar el archivo Excel usando el servicio
            const response = await clienteService.importExcel(selectedFile.value!)
            console.log(response)
            
            if (response.success) {
                // Recargar la lista de archivos desde el backend
                await loadArchivos()

                // Reset form
                selectedFile.value = null
                showCreateModal.value = false

                // Mostrar modal de éxito
                showSuccess('Importación Exitosa', response.message || 'El archivo se ha importado correctamente.')
            } else {
                // Si la respuesta no es exitosa, mostrar error
                showCreateModal.value = false
                showError('Error de Importación', response.message || 'Error al importar el archivo Excel')
            }
        }, 'Importando archivo Excel...')
    } catch (error: any) {
        console.error('Error al subir archivo:', error)
        
        // Cerrar modal de upload
        showCreateModal.value = false
        
        // Mostrar modal de error
        showError('Error de Importación', error.message || 'Error al importar el archivo Excel')
    }
}

const handleCreateArchivo = async () => {
    if (!newArchivo.value.nombre) return

    createLoading.value = true

    try {
        // Recargar la lista de archivos
        await loadArchivos()

        // Reset form
        newArchivo.value = { nombre: '', descripcion: '' }
        showCreateModal.value = false

        // Show success modal
        const { showSuccess } = useModal()
        showSuccess('Archivo Creado', 'El archivo se ha creado correctamente.')
    } catch (error) {
        console.error('Error al crear archivo:', error)
        const { showError } = useModal()
        showError('Error de Creación', 'Error al crear el archivo')
    } finally {
        createLoading.value = false
    }
}

const handleDownloadExcel = async (id: number, rutaArchivo: string) => {

    const a = document.createElement('a')
    a.href = rutaArchivo
    a.target = '_blank'
    a.download = rutaArchivo
    a.click()
    a.remove()
    //download


}

const loadArchivos = async () => {
    try {
        await withSpinner(async () => {
            const { clienteService } = await import('~/services/clienteService')
            const response = await clienteService.getExcelsList()

            if (response.success) {
                archivos.value = response.data
            }
        }, 'Cargando archivos...')
    } catch (error) {
        console.error('Error al cargar archivos:', error)
        showError('Error de Carga', 'Error al cargar la lista de archivos')
    }
}

const handleDeleteArchivo = async (id: number) => {
    try {
        await withSpinner(async () => {
            const response = await clienteService.deleteExcel(id)
            if (response.success) {
                await loadArchivos()
                showSuccess('Eliminación Exitosa', 'El archivo se ha eliminado correctamente.')
            }
        }, 'Eliminando archivo...')
    } catch (error) {
        console.error('Error al eliminar archivo:', error)
        showError('Error de Eliminación', 'Error al eliminar el archivo')
    }
}

// Initialize data
onMounted(async () => {
    await loadArchivos()
})
</script>