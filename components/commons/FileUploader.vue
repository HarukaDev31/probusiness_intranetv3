<template>
    <div class="file-uploader">
        <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ label }}
        </label>

        <!-- Archivos existentes del proveedor -->
        <div v-if="proveedorActivo?.[campoProveedor]" class="mb-4">
            <div class="file-info-box">
                <div class="file-info">
                    <div class="file-iconic">
                        <UIcon :name="getFileIcon(proveedorActivo[campoProveedor])" />
                    </div>
                    <div class="flex-1">
                        <span class="file-name">{{ label }} del Proveedor</span>
                        <div class="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>Documento cargado</span>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <UButton @click="downloadFile(proveedorActivo[campoProveedor])" color="primary" variant="ghost"
                            size="xs">
                            <UIcon name="i-heroicons-arrow-down-tray" />
                        </UButton>
                        <UButton v-if="edit" @click="deleteProviderDocument(campoProveedor)" color="error"
                            variant="ghost" size="xs">
                            <UIcon name="i-heroicons-trash" />
                        </UButton>
                    </div>
                </div>
            </div>
        </div>

        <!-- Archivos existentes del sistema -->
        <div v-if="archivosPorTipo[campo] && archivosPorTipo[campo].length > 0" class="mb-4">
            <div v-for="archivo in archivosPorTipo[campo]" :key="archivo.id" class="file-info-box">
                <div class="file-info">
                    <div class="file-iconic">

                    </div>
                    <div class="flex-1">
                        <span class="file-name">{{ archivo.nombre }}</span>
                        <div class="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{{ formatFileSize(archivo.tamaño) }}</span>
                            <span>{{ formatDate(archivo.fecha_subida) }}</span>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <UButton @click="downloadFile(archivo.url)" color="primary" variant="ghost" size="xs">
                            <UIcon name="i-heroicons-arrow-down-tray" />
                        </UButton>
                        <UButton v-if="edit" @click="deleteFile(archivo.id)" color="error" variant="ghost" size="xs">
                            <UIcon name="i-heroicons-trash" />
                        </UButton>
                    </div>
                </div>
            </div>
        </div>

        <!-- Subir nuevo archivo - solo si no hay archivos y es editable -->
        <div v-if="edit && !proveedorActivo?.[campoProveedor] && (!archivosPorTipo[campo] || archivosPorTipo[campo].length === 0)"
            class="file-upload-box" @click="openFileInput(campo)">
            <input :ref="`${campo}Input`" type="file" class="file-input" :accept="acceptTypes" :multiple="multiple"
                @change="onFileSelect(campo, $event)" />
            <div class="file-label d-flex">
                <UIcon name="i-heroicons-cloud-arrow-up" class="text-2xl" />
                <div class="file-group-text">
                    <span class="file-text">{{ multiple ? 'Selecciona o arrastra tus archivos aquí' : 'Selecciona o arrastra tu archivo aquí' }}</span>
                    <span class="file-format">{{ acceptTypesText }}</span>
                </div>
                <UButton class="upload-button" size="sm">
                    {{ multiple ? 'Subir archivos' : 'Subir archivo' }}
                </UButton>
            </div>

            <!-- Información de archivos seleccionados -->
            <div v-if="archivosSeleccionados[campo] && archivosSeleccionados[campo].length > 0" class="space-y-2">
                <div v-for="(archivo, index) in archivosSeleccionados[campo]" :key="index" class="file-info-box">
                    <div class="file-info">
                        <div class="file-iconic">
                            <UIcon :name="getFileIcon(archivo.name)" />
                        </div>
                        <span class="file-name">{{ archivo.name }}</span>
                        <span class="file-size">{{ formatFileSize(archivo.size) }}</span>
                        <UButton @click="removeSelectedFile(campo, index)" color="error" variant="ghost" size="xs">
                            <UIcon name="i-heroicons-trash" />
                        </UButton>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * FileUploader - Componente para subida y gestión de archivos
 * 
 * Este componente permite:
 * - Mostrar archivos existentes del proveedor y del sistema
 * - Subir nuevos archivos (simple o múltiple)
 * - Descargar archivos existentes
 * - Eliminar archivos (con permisos de edición)
 * - Validación de tipos de archivo
 * 
 * @example
 * <!-- Uso básico -->
 * <FileUploader
 *   label="Factura Comercial"
 *   campo="factura"
 *   campo-proveedor="factura_comercial"
 *   :proveedor-activo="proveedorActivo"
 *   :archivos-por-tipo="archivosPorTipo"
 *   :archivos-seleccionados="archivosSeleccionados"
 *   :edit="true"
 *   @download-file="handleDownload"
 *   @file-selected="handleFileSelect"
 * />
 * 
 * @example
 * <!-- Múltiple archivos -->
 * <FileUploader
 *   label="Imágenes del Producto"
 *   campo="imagenes"
 *   campo-proveedor="imagenes_producto"
 *   :multiple="true"
 *   accept-types=".png, .jpg, .jpeg"
 *   accept-types-text="Formatos: .png, .jpg, .jpeg"
 *   :proveedor-activo="proveedorActivo"
 *   :archivos-por-tipo="archivosPorTipo"
 *   :archivos-seleccionados="archivosSeleccionados"
 *   :edit="true"
 *   @file-selected="handleImageSelect"
 * />
 */

interface Props {
    /** Etiqueta del campo de archivo */
    label?: string
    /** Campo identificador para el tipo de archivo */
    campo: string
    /** Campo del proveedor que contiene la URL del archivo */
    campoProveedor: string
    /** Objeto del proveedor activo con información de archivos */
    proveedorActivo?: any
    /** Archivos organizados por tipo */
    archivosPorTipo: Record<string, any[]>
    /** Archivos seleccionados para subir, organizados por tipo */
    archivosSeleccionados: Record<string, File[]>
    /** Indica si el componente está en modo edición */
    edit: boolean
    /** Permite seleccionar múltiples archivos */
    multiple?: boolean
    /** Tipos de archivo aceptados (formato HTML input accept) */
    acceptTypes?: string
    /** Texto descriptivo de los tipos de archivo aceptados */
    acceptTypesText?: string
}

interface Emits {
    /** Se emite cuando se hace clic en descargar un archivo */
    (e: 'download-file', url: string): void
    /** Se emite cuando se elimina un documento del proveedor */
    (e: 'delete-provider-document', field: string): void
    /** Se emite cuando se elimina un archivo del sistema */
    (e: 'delete-file', id: number): void
    /** Se emite cuando se activa el input de archivo */
    (e: 'open-file-input', field: string): void
    /** Se emite cuando se selecciona un archivo para subir */
    (e: 'file-selected', field: string, event: Event): void
    /** Se emite cuando se elimina un archivo seleccionado */
    (e: 'remove-selected-file', field: string, index: number): void
}

const props = withDefaults(defineProps<Props>(), {
    label: '',
    multiple: false,
    acceptTypes: '.xlsx, .xls, .xlsm, .csv, .xlsb, .xltx, .xlt, .png, .jpg, .jpeg, .pdf',
    acceptTypesText: 'Formatos: .xlsx, .png, .jpg, .jpeg, .pdf'
})

const emit = defineEmits<Emits>()

/**
 * Emite evento para descargar un archivo
 * @param url - URL del archivo a descargar
 */
const downloadFile = (url: string) => emit('download-file', url)

/**
 * Emite evento para eliminar un documento del proveedor
 * @param field - Campo del proveedor a eliminar
 */
const deleteProviderDocument = (field: string) => emit('delete-provider-document', field)

/**
 * Emite evento para eliminar un archivo del sistema
 * @param id - ID del archivo a eliminar
 */
const deleteFile = (id: number) => emit('delete-file', id)

/**
 * Emite evento para activar el input de archivo
 * @param field - Campo para el cual activar el input
 */
const openFileInput = (field: string) => emit('open-file-input', field)

/**
 * Emite evento cuando se selecciona un archivo
 * @param field - Campo para el cual se seleccionó el archivo
 * @param event - Evento del input file
 */
const onFileSelect = (field: string, event: Event) => emit('file-selected', field, event)

/**
 * Emite evento para eliminar un archivo seleccionado
 * @param field - Campo del archivo a eliminar
 * @param index - Índice del archivo en la lista
 */
const removeSelectedFile = (field: string, index: number) => emit('remove-selected-file', field, index)

/**
 * Obtiene el icono apropiado según la extensión del archivo
 * @param nombre - Nombre del archivo
 * @returns Nombre del icono de Heroicons
 */
const getFileIcon = (nombre: string) => {
    if (!nombre) return 'i-heroicons-document'

    const extension = nombre.split('.').pop()?.toLowerCase()
    const iconMap: Record<string, string> = {
        'pdf': 'i-heroicons-document-text',
        'xlsx': 'i-heroicons-table-cells',
        'xls': 'i-heroicons-table-cells',
        'csv': 'i-heroicons-table-cells',
        'png': 'i-heroicons-photo',
        'jpg': 'i-heroicons-photo',
        'jpeg': 'i-heroicons-photo'
    }
    return iconMap[extension || ''] || 'i-heroicons-document'
}

/**
 * Formatea el tamaño del archivo en unidades legibles
 * @param tamaño - Tamaño en bytes
 * @returns Tamaño formateado (B, KB, MB, GB)
 */
const formatFileSize = (tamaño: number) => {
    if (tamaño < 1024) return `${tamaño} B`
    if (tamaño < 1024 * 1024) return `${(tamaño / 1024).toFixed(1)} KB`
    if (tamaño < 1024 * 1024 * 1024) return `${(tamaño / (1024 * 1024)).toFixed(1)} MB`
    return `${(tamaño / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

/**
 * Formatea una fecha en formato legible
 * @param fecha - Fecha en formato string
 * @returns Fecha formateada en formato local español
 */
const formatDate = (fecha: string) => {
    if (!fecha) return '-'
    try {
        return new Date(fecha).toLocaleDateString('es-ES')
    } catch {
        return fecha
    }
}
</script>

<style scoped>
/* Estilos del componente FileUploader */
</style>