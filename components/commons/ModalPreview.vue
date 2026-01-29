<template>
    <UModal :is-open="isOpen" @close="$emit('close')" class="sm:max-w-6xl max-h-[85vh]">
        <slot name="trigger" />
        <template #header>
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Vista previa del archivo
                </h3>
            </div>
        </template>
        <template #body>
            <div class="space-y-3">
                <!-- Contenido del archivo -->
                <div class="w-full">
                    <!-- Imagen -->
                    <div v-if="isImage" class="relative overflow-hidden rounded-lg w-full flex justify-center">
                        <img 
                            :src="file?.file_url || ''" 
                            :alt="file?.file_name || 'Imagen'"
                            class="max-w-full max-h-[45vh] object-contain select-none cursor-grab"
                            @mousedown="handleMouseDown"
                            @mousemove="handleMouseMove"
                            @mouseup="handleMouseUp"
                            @mouseleave="handleMouseLeave"
                            @wheel="handleWheel"
                            @dragstart.prevent
                            @selectstart.prevent
                            draggable="false"
                            :style="{
                                transform: 'scale(' + imageScale + ') translate(' + imagePosition.x + 'px, ' + imagePosition.y + 'px)',
                                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                                cursor: isDragging ? 'grabbing' : 'grab'
                            }"
                        />
                        
                        <!-- Controles de zoom para imagen -->
                        <div class="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg p-2">
                            <UButton
                                icon="i-heroicons-minus"
                                variant="ghost"
                                size="xs"
                                @click="zoomOut"
                                :disabled="imageScale <= 0.5"
                                class="text-gray-700 dark:text-gray-300"
                            />
                            <span class="text-xs font-medium min-w-[50px] text-center text-gray-700 dark:text-gray-300">
                                {{ Math.round(imageScale * 100) }}%
                            </span>
                            <UButton
                                icon="i-heroicons-plus"
                                variant="ghost"
                                size="xs"
                                @click="zoomIn"
                                :disabled="imageScale >= 3"
                                class="text-gray-700 dark:text-gray-300"
                            />
                            <UButton
                                icon="i-heroicons-arrow-path"
                                variant="ghost"
                                size="xs"
                                @click="resetImage"
                                class="text-gray-700 dark:text-gray-300"
                                title="Restablecer zoom"
                            />
                        </div>
                    </div>

                    <!-- Video -->
                    <div v-else-if="isVideo" class="w-full flex justify-center">
                        <video 
                            :src="file?.file_url || ''" 
                            controls
                            playsinline
                            webkit-playsinline="true"
                            preload="metadata"
                            class="max-w-full max-h-[45vh] rounded-lg shadow-lg"
                            crossorigin="anonymous">
                            <source :src="file?.file_url || ''" :type="getVideoMimeType">
                            Tu navegador no soporta el elemento de video.
                        </video>
                    </div>

                    <!-- Documento -->
                    <div v-else-if="isDocument" class="w-full">
                        <!-- Vista previa de Excel -->
                        <div v-if="isExcelFile" class="w-full">
                            <!-- Loading state -->
                            <div v-if="isLoadingExcel" class="flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div class="flex items-center space-x-2">
                                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    <span class="text-gray-600 dark:text-gray-400">Cargando archivo Excel...</span>
                                </div>
                            </div>
                            
                                                            <!-- Excel preview -->
                                <div v-else-if="excelData" class="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
                                    <!-- Debug info (temporal) -->
                                    <div class="p-2 bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-700 dark:text-blue-300 border-b border-blue-200 dark:border-blue-700">
                                        <strong>Debug:</strong> 
                                        <span class="font-medium">Headers:</span> {{ excelData.sheets[activeSheet]?.headers?.length || 0 }} | 
                                        <span class="font-medium">Filas de datos:</span> {{ excelData.sheets[activeSheet]?.data?.length || 0 }} | 
                                        <span class="font-medium">Primeros headers:</span> {{ excelData.sheets[activeSheet]?.headers?.slice(0, 3).join(' | ') || 'N/A' }} |
                                        <span class="font-medium">Total columnas:</span> {{ excelData.sheets[activeSheet]?.headers?.length || 0 }}
                                    </div>
                                  
                                <!-- Tabs para hojas -->
                                <div class="border-b border-gray-200 dark:border-gray-700">
                                    <div class="flex space-x-1 p-2 bg-gray-50 dark:bg-gray-800 overflow-x-auto">
                                        <button
                                            v-for="(sheet, index) in excelData.sheets"
                                            :key="index"
                                            @click="activeSheet = index"
                                            :class="[
                                                'px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                                                activeSheet === index
                                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                            ]"
                                        >
                                            {{ sheet.name }}
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Tabla de datos -->
                                <div class="overflow-auto max-h-[45vh]">
                                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700">
                                        <thead class="bg-gray-50 dark:bg-gray-800 sticky top-0">
                                            <tr>
                                                <th
                                                    v-for="(header, colIndex) in excelData.sheets[activeSheet]?.headers || []"
                                                    :key="colIndex"
                                                    class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 min-w-[120px]"
                                                >
                                                    {{ header || 'Col ' + (colIndex + 1) }}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                            <tr
                                                v-for="(row, rowIndex) in excelData.sheets[activeSheet]?.data || []"
                                                :key="rowIndex"
                                                :class="rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'"
                                            >
                                                <td
                                                    v-for="(cell, colIndex) in row"
                                                    :key="colIndex"
                                                    class="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 min-w-[120px]"
                                                >
                                                    {{ cell || '' }}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                
                                <!-- Información de la hoja -->
                                <div class="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                                    <span class="font-medium">Hoja:</span> {{ excelData.sheets[activeSheet]?.name || 'Sin nombre' }} | 
                                    <span class="font-medium">Filas:</span> {{ (excelData.sheets[activeSheet]?.data?.length || 0) + 1 }} | 
                                    <span class="font-medium">Columnas:</span> {{ excelData.sheets[activeSheet]?.headers?.length || 0 }}
                                </div>
                            </div>
                        </div>
                        <!-- Vista previa de PDF -->
                        <div v-else-if="isPdfFile" class="w-full">
                            <iframe :src="file?.file_url || ''" class="w-full h-[45vh] rounded-lg shadow-lg" frameborder="0"></iframe>
                        </div>
                        <!-- Otros documentos (PDF, DOC, etc.) -->
                        <div v-else class="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <UIcon :name="getDocumentIcon" class="w-24 h-24 text-gray-400 mb-4" />
                            <p class="text-lg font-medium text-gray-700 dark:text-gray-300">
                                {{ file?.file_name || 'Documento' }}
                            </p>
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                {{ getFileExtension }}
                            </p>
                        </div>
                    </div>

                    <!-- Archivo genérico -->
                    <div v-else
                        class="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <UIcon name="i-heroicons-document" class="w-24 h-24 text-gray-400 mb-4" />
                        <p class="text-lg font-medium text-gray-700 dark:text-gray-300">
                            {{ file?.file_name || 'Archivo' }}
                        </p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            {{ getFileExtension }}
                        </p>
                    </div>
                </div>

                <!-- Información del archivo -->
                <!-- <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="font-medium text-gray-700 dark:text-gray-300">Nombre:</span>
                            <p class="text-gray-600 dark:text-gray-400 truncate">{{ file?.file_name || 'Sin nombre' }}
                            </p>
                        </div>
                        <div>
                            <span class="font-medium text-gray-700 dark:text-gray-300">Tipo:</span>
                            <p class="text-gray-600 dark:text-gray-400">{{ getFileExtension }}</p>
                        </div>
                        <div v-if="file?.size">
                            <span class="font-medium text-gray-700 dark:text-gray-300">Tamaño:</span>
                            <p class="text-gray-600 dark:text-gray-400">{{ formatFileSize(file.size || 0) }}</p>
                        </div>
                    </div>
                </div> -->
            </div>
        </template>
        <template #footer="{ close }">
            <div class="flex justify-end space-x-2">
                <UButton v-if="file?.file_url" icon="i-heroicons-arrow-down-tray" label="Descargar" color="primary"
                    @click="downloadFile" />
                <UButton v-if="file?.file_url" icon="i-heroicons-arrow-top-right-on-square"
                    label="Abrir en nueva pestaña" variant="outline" @click="openInNewTab" />
                <UButton label="Cerrar" variant="ghost" @click="close" />
            </div>
        </template>

    </UModal>
</template>

<script setup lang="ts">
import type { FileItem } from '../types/commons/file'
import { useSpinner } from '../composables/commons/useSpinner'
import { useModal } from '../composables/commons/useModal'
const { withSpinner } = useSpinner()
const { showError } = useModal()
interface Props {
    isOpen: boolean
    file?: FileItem | File | null
}

interface Emits {
    (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Image zoom state
const imageScale = ref(1)
const imagePosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const dragOffset = ref({ x: 0, y: 0 })

// Excel preview state
const excelData = ref<any>(null)
const activeSheet = ref(0)
const isLoadingExcel = ref(false)

// Computed properties
const isImage = computed(() => {
    if (!props.file?.file_name) return false
    const extension = props.file.file_name.split('.').pop()?.toLowerCase()
    console.log(extension)
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg','jpeg'].includes(extension || '')
})

const isVideo = computed(() => {
    if (!props.file?.file_name) return false
    const extension = props.file.file_name.split('.').pop()?.toLowerCase()
    return ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension || '')
})

const isDocument = computed(() => {
    if (!props.file?.file_name) return false
    const extension = props.file.file_name.split('.').pop()?.toLowerCase()
    return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(extension || '')
})

const isExcelFile = computed(() => {
    if (!props.file?.file_name) return false
    const extension = props.file.file_name.split('.').pop()?.toLowerCase()
    return ['xls', 'xlsx', 'xlsm'].includes(extension || '')
})
const isPdfFile = computed(() => {
    if (!props.file?.file_name) return false
    const extension = props.file.file_name.split('.').pop()?.toLowerCase()
    return ['pdf'].includes(extension || '')
})
const getVideoMimeType = computed(() => {
    if (!props.file?.file_name) return 'video/mp4'
    const extension = props.file.file_name.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
        'mp4': 'video/mp4',
        'avi': 'video/avi',
        'mov': 'video/quicktime',
        'wmv': 'video/x-ms-wmv',
        'flv': 'video/x-flv',
        'webm': 'video/webm'
    }
    return mimeTypes[extension || ''] || 'video/mp4'
})

const getFileExtension = computed(() => {
    if (!props.file?.file_name) return 'Archivo'
    const extension = props.file.file_name.split('.').pop()?.toUpperCase()
    return extension || 'Archivo'
})

const getDocumentIcon = computed(() => {
    if (!props.file?.file_name) return 'i-heroicons-document'

    const extension = props.file.file_name.split('.').pop()?.toLowerCase()
    const iconMap: Record<string, string> = {
        'pdf': 'vscode-icons:file-type-pdf2',
        'doc': 'vscode-icons:file-type-word',
        'docx': 'vscode-icons:file-type-word',
        'xls': 'vscode-icons:file-type-excel',
        'xlsx': 'vscode-icons:file-type-excel',
        'ppt': 'i-heroicons-presentation-chart-line',
        'pptx': 'i-heroicons-presentation-chart-line',
        'txt': 'i-heroicons-document-text'
    }
    return iconMap[extension || ''] || 'i-heroicons-document'
})


const downloadFile = async () => {
    if (!props.file?.file_url) return
    
    try {
        await withSpinner(async () => {
            const fileUrl = props.file!.file_url!
            const response = await fetch(fileUrl)
            
            if (!response.ok) {
                throw new Error(`Error al descargar: ${response.status}`)
            }
            
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = props.file!.file_name || 'archivo'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        }, 'Descargando archivo...')
    } catch (error) {
        showError('Error al descargar archivo', 'Error al descargar archivo')
    }
}

const openInNewTab = () => {
    if (props.file?.file_url) {
        window.open(props.file.file_url, '_blank')
    }
}

// Excel preview methods
const loadExcelFile = async () => {
    if (!props.file?.file_url || !isExcelFile.value) return
    
    try {
        isLoadingExcel.value = true
        excelData.value = null
        
        // Lazy load xlsx solo cuando sea necesario
        const XLSX = await import('xlsx')
        
        const response = await fetch(props.file.file_url)
        if (!response.ok) throw new Error('Error al cargar archivo Excel')
        
        const arrayBuffer = await response.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        
        const sheets = workbook.SheetNames.map((sheetName: string) => {
            const worksheet = workbook.Sheets[sheetName]
            
            // Usar sheet_to_json con header: 1 para obtener array de arrays
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1,
                defval: '' // Valor por defecto para celdas vacías
            }) as any[][]
            
             // Debug
            
            // Detección dinámica de headers basada en el patrón de distribución de contenido
            let headerRowIndex = 0
            let bestHeaderScore = 0
            
            for (let i = 0; i < jsonData.length; i++) {
                const row = jsonData[i]
                if (Array.isArray(row)) {
                    // Calcular score de "header-ness" basado en múltiples criterios
                    let score = 0
                    
                    // 1. Contar celdas con texto significativo
                    const nonEmptyCells = row.filter((cell: any) => 
                        cell !== undefined && cell !== null && cell !== '' && 
                        typeof cell === 'string' && cell.length > 3
                    ).length
                    
                    // 2. Verificar distribución uniforme (headers típicamente están distribuidos)
                    const cellDistribution = row.map((cell: any, index: number) => {
                        if (cell !== undefined && cell !== null && cell !== '' && 
                            typeof cell === 'string' && cell.length > 3) {
                            return index
                        }
                        return -1
                    }).filter(index => index !== -1)
                    
                    // 3. Calcular score basado en distribución y cantidad
                    if (nonEmptyCells > 0) {
                        // Bonus por cantidad de celdas con texto
                        score += nonEmptyCells * 2
                        
                        // Bonus por distribución uniforme (headers típicamente están espaciados)
                        if (cellDistribution.length > 1) {
                            const gaps = []
                            for (let j = 1; j < cellDistribution.length; j++) {
                                gaps.push(cellDistribution[j] - cellDistribution[j-1])
                            }
                            const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
                            // Si los gaps son consistentes (típico de headers), dar bonus
                            if (avgGap <= 3) score += 5
                        }
                        
                        // Penalizar filas con mucho texto en pocas celdas (como títulos)
                        const totalTextLength = row.reduce((sum: number, cell: any) => {
                            if (typeof cell === 'string') return sum + cell.length
                            return sum
                        }, 0)
                        
                        if (nonEmptyCells === 1 && totalTextLength > 50) {
                            score -= 10 // Es probablemente un título, no headers
                        }
                    }
                    
                    // Si este score es mejor que el anterior, actualizar
                    if (score > bestHeaderScore) {
                        bestHeaderScore = score
                        headerRowIndex = i
                    }
                }
            }
            
            // Obtener headers de la fila encontrada
            const headers = Array.isArray(jsonData[headerRowIndex]) ? jsonData[headerRowIndex] : []
            
            // Filtrar columnas vacías al final de los headers
            let lastNonEmptyIndex = headers.length - 1
            while (lastNonEmptyIndex >= 0 && (headers[lastNonEmptyIndex] === '' || headers[lastNonEmptyIndex] === undefined)) {
                lastNonEmptyIndex--
            }
            const trimmedHeaders = headers.slice(0, lastNonEmptyIndex + 1)
            
            // Obtener datos (filas después de los headers) - filtrar filas completamente vacías
            const data = jsonData.slice(headerRowIndex + 1).filter((row: any[]) => {
                if (!Array.isArray(row)) return false
                return row.some((cell: any) => cell !== undefined && cell !== null && cell !== '')
            })
            
            // Normalizar datos para que tengan el mismo número de columnas que los headers
            const maxCols = trimmedHeaders.length
            const normalizedData = data.map(row => {
                const normalizedRow = new Array(maxCols).fill('')
                row.forEach((cell, index) => {
                    if (index < maxCols) {
                        normalizedRow[index] = cell || ''
                    }
                })
                return normalizedRow
            })
            
            
            return {
                name: sheetName,
                headers: trimmedHeaders,
                data: normalizedData
            }
        })
        
        excelData.value = { sheets }
        activeSheet.value = 0
        
    } catch (error) {
        showError('Error al cargar archivo Excel', 'No se pudo cargar la vista previa del archivo Excel')
    } finally {
        isLoadingExcel.value = false
    }
}

// Image zoom methods
const resetImage = () => {
    imageScale.value = 1
    imagePosition.value = { x: 0, y: 0 }
    isDragging.value = false
}

const zoomIn = () => {
    if (imageScale.value < 3) {
        imageScale.value = Math.min(3, imageScale.value + 0.25)
    }
}

const zoomOut = () => {
    if (imageScale.value > 0.5) {
        imageScale.value = Math.max(0.5, imageScale.value - 0.25)
    }
}

const handleMouseDown = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    isDragging.value = true
    dragStart.value = { x: event.clientX, y: event.clientY }
    dragOffset.value = { ...imagePosition.value }
}

const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging.value) return
    
    event.preventDefault()
    event.stopPropagation()
    
    const deltaX = event.clientX - dragStart.value.x
    const deltaY = event.clientY - dragStart.value.y
    
    imagePosition.value = {
        x: dragOffset.value.x + deltaX,
        y: dragOffset.value.y + deltaY
    }
}

const handleMouseUp = () => {
    isDragging.value = false
}

const handleMouseLeave = () => {
    isDragging.value = false
}

const handleWheel = (event: WheelEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (event.deltaY < 0) {
        zoomIn()
    } else {
        zoomOut()
    }
}

// Reset image when modal opens or file changes
watch([() => props.isOpen, () => props.file], () => {
    if (props.isOpen) {
        resetImage()
        // Load Excel file if it's an Excel file
        if (isExcelFile.value) {
            loadExcelFile()
        }
        }
})
</script>
