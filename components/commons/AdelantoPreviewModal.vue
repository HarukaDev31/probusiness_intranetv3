<template>
    <UModal :show="modelValue" @close="closeModal">
        <template #header>
            <div class="text-lg font-semibold">
                Detalle del Adelanto
            </div>
        </template>

        <template #body>
            <div class="space-y-4">
                <!-- Sección de detalles -->
                <div class="space-y-3">
                    <!-- Monto -->
                    <div class="flex flex-col">
                        <span class="text-sm font-medium text-gray-600">Monto:</span>
                        <span class="text-base">S/ {{ pago?.monto }}</span>
                    </div>
                    <!-- Fecha -->
                    <div class="flex flex-col">
                        <span class="text-sm font-medium text-gray-600">Fecha:</span>
                        <span class="text-base">{{ formatDateTimeToDmy(pago?.fecha_pago) }}</span>
                    </div>
                    <!-- Banco -->
                    <div class="flex flex-col">
                        <span class="text-sm font-medium text-gray-600">Banco:</span>
                        <div class="mt-1">
                            <span class="text-base">{{ pago?.banco }}</span>
                        </div>
                    </div>
                </div>
                <!-- Sección del voucher -->
                <div class="space-y-2">
                    <span class="text-sm font-medium text-gray-600">Voucher:</span>
                    <div class="relative border rounded-lg overflow-hidden">
                        <div class="flex justify-center">
                            <img 
                                :src="pago?.voucher_url" 
                                alt="Voucher" 
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
                                    transform: `scale(${imageScale}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                                    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                                    cursor: isDragging ? 'grabbing' : 'grab'
                                }"
                            />
                        </div>
                        
                        <!-- Controles de zoom -->
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
                </div>
            </div>
        </template>

        <template #footer>
            <div class="flex justify-end space-x-3">
                <UButton
                    color="neutral"
                    variant="outline"
                    @click="closeModal"
                >
                    Cerrar
                </UButton>
                <UButton
                    color="primary"
                    variant="solid"
                    icon="i-heroicons-trash"
                    :loading="loading"
                    @click="handleDelete"
                >
                    Eliminar
                </UButton>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { formatDate } from '~/utils/formatters'
import { useModal } from '~/composables/commons/useModal'

const props = defineProps<{
    modelValue: boolean
    pago: {
        id: number
        monto: string
        fecha_pago: string
        estado: string
        is_confirmed: number
        banco: string
        voucher_url: string
    }
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'onDelete': []
}>()

const { showConfirmation } = useModal()
const loading = ref(false)

// Image zoom state
const imageScale = ref(1)
const imagePosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const dragOffset = ref({ x: 0, y: 0 })

const closeModal = () => {
    emit('update:modelValue', false)
}

const handleDelete = () => {
    showConfirmation(
        '¿Estás seguro de eliminar este voucher?',
        'Esta acción no se puede deshacer.',
        () => {
            emit('onDelete')
        }
    )
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

// Reset image when modal opens
watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        resetImage()
    }
})
</script>