<template>
    <UModal :class="showPreview ? 'max-w-6xl' : 'max-w-md'">
        <template #header>
            <div class="text-center">
                <h3 class="text-lg font-semibold">
                    Detalle del Adelanto
                </h3>
            </div>
        </template>
        
        <template #body>
            <div class="flex gap-6">
                <!-- Información del pago -->
                <div class="space-y-4" :class="showPreview ? 'w-1/3 min-w-[300px]' : 'w-full'">
                    <!-- Monto -->
                    <div class="flex justify-between items-center">
                        <span class="font-medium">Monto:</span>
                        <span class="text-lg font-semibold"> {{ formatCurrency(parseFloat(pagoDetails.monto),props.currency) }}</span>
                    </div>

                    <!-- Fecha -->
                    <div class="flex justify-between items-center">
                        <span class="font-medium">Fecha:</span>
                        <span>{{ formatDateTimeToDmy(pagoDetails.payment_date) }}</span>
                    </div>

                    <!-- Banco -->
                    <div class="flex justify-between items-center">
                        <span class="font-medium">Banco:</span>
                        <div class="flex items-center gap-2">
                            <img 
                                :src="getBancoLogo(pagoDetails.banco)" 
                                :alt="pagoDetails.concepto"
                                class="w-8 h-8 object-contain"
                            />
                            <span>{{ getBancoName(pagoDetails.banco) }}</span>
                        </div>
                    </div>

                    <!-- Archivo -->
                    <div v-if="pagoDetails.voucher_url" class="space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="font-medium">Archivo:</span>
                            <div class="flex items-center gap-2">
                                <UButton
                                    icon="i-heroicons-eye"
                                    variant="ghost"
                                    size="sm"
                                    @click="togglePreview"
                                    :color="showPreview ? 'primary' : 'neutral'"
                                />
                                <UButton
                                    icon="i-heroicons-arrow-down-tray"
                                    variant="ghost"
                                    size="sm"
                                    @click="handleDownload(pagoDetails.voucher_url)"
                                />
                            </div>
                        </div>
                        <div class="text-sm text-gray-600 break-all">
                            {{ pagoDetails.voucher_url.split('/').pop() }}
                        </div>
                    </div>
                </div>

                <!-- Vista previa del archivo -->
                <div v-if="showPreview && pagoDetails.voucher_url" class="flex-1 min-h-[500px]">
                    <div class="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 relative h-[500px]">
                        <!-- Controles de zoom -->
                        <div class="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
                            <UButton
                                icon="i-heroicons-minus"
                                variant="ghost"
                                size="sm"
                                @click="zoomOut"
                                :disabled="imageScale <= 0.5"
                            />
                            <span class="text-sm font-medium min-w-[60px] text-center">
                                {{ Math.round(imageScale * 100) }}%
                            </span>
                            <UButton
                                icon="i-heroicons-plus"
                                variant="ghost"
                                size="sm"
                                @click="zoomIn"
                                :disabled="imageScale >= 3"
                            />
                            <UButton
                                icon="i-heroicons-arrow-path"
                                variant="ghost"
                                size="sm"
                                @click="resetImage"
                            />
                        </div>

                        <!-- Contenedor de la imagen/documento -->
                        <div class="w-full h-full flex items-center justify-center overflow-hidden">
                            <img 
                                v-if="isImageFile(pagoDetails.voucher_url)"
                                :src="pagoDetails.voucher_url" 
                                :alt="'Voucher de pago'"
                                class="max-w-full max-h-full object-contain select-none"
                                @mousedown="handleMouseDown"
                                @mousemove="handleMouseMove"
                                @mouseup="handleMouseUp"
                                @mouseleave="handleMouseLeave"
                                @wheel="handleWheel"
                                @dragstart.prevent
                                @selectstart.prevent
                                draggable="false"
                                :style="{
                                    transform: `scale(${imageScale}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                                    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                                    cursor: isDragging ? 'grabbing' : 'grab'
                                }"
                            />
                            <iframe
                                v-else-if="isPdfFile(pagoDetails.voucher_url)"
                                :src="pagoDetails.voucher_url"
                                class="w-full h-full border-0"
                                title="Vista previa del documento PDF"
                            />
                            <div v-else class="text-center p-8">
                                <div class="text-gray-500 mb-4">
                                    <i class="i-heroicons-document text-6xl"></i>
                                </div>
                                <p class="text-gray-600">Vista previa no disponible para este tipo de archivo</p>
                                <UButton 
                                    class="mt-4"
                                    @click="handleDownload(pagoDetails.voucher_url)"
                                >
                                    Descargar archivo
                                </UButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <template #footer="{ close }">
            <div class="flex justify-end">
                <UButton v-if="showDelete"
                    icon="i-heroicons-trash"
                    color="error"
                    variant="solid"
                    @click="handleDelete"
                />
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { PagosDetails } from '~/types/cargaconsolidada/clientes/pagos'
import { formatCurrency } from '~/utils/formatters'

interface Props {
    pagoDetails : PagosDetails
    currency:string
    showDelete: boolean
}

const props = withDefaults(defineProps<Props>(), {
    currency: 'PEN',
    showDelete: true
})

const emit = defineEmits<{
    'delete': [pagoId: number]
    'close': []
}>()

// Estado para la vista previa
const showPreview = ref(false)

// Estado para el zoom y arrastre (similar a ImageModal)
const imageScale = ref(1)
const imagePosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const dragOffset = ref({ x: 0, y: 0 })

// Métodos para formatear y obtener datos
const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}

const getBancoLogo = (concepto: string) => {
    const bancos = {
        'BCP': 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Logo_credito.gif',
        'INTERBANK': 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Interbank_logo.svg',
        'YAPE': 'https://upload.wikimedia.org/wikipedia/commons/0/08/Icono_de_la_aplicaci%C3%B3n_Yape.png'
    }
    return bancos[concepto as keyof typeof bancos] || ''
}

const getBancoName = (concepto: string) => {
    const bancos = {
        'BCP': 'Banco de Crédito BCP',
        'INTERBANK': 'Interbank',
        'YAPE': 'YAPE'
    }
    return bancos[concepto as keyof typeof bancos] || concepto
}

const handleDownload = (url: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = 'voucher.pdf'
    link.target = '_blank'
    document.body.appendChild(link)

    link.click()
    document.body.removeChild(link)
}

const handleDelete = () => {
    emit('delete', props.pagoDetails.id_pago)
}

// Métodos para la vista previa
const togglePreview = () => {
    showPreview.value = !showPreview.value
    if (showPreview.value) {
        resetImage()
    }
}

// Métodos para determinar el tipo de archivo
const isImageFile = (url: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
    const extension = url.toLowerCase().substring(url.lastIndexOf('.'))
    return imageExtensions.includes(extension)
}

const isPdfFile = (url: string) => {
    return url.toLowerCase().includes('.pdf')
}

// Métodos de zoom y arrastre (copiados de ImageModal)
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
</script>
