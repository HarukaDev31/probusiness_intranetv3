<template>
  <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" @click="handleModalClick">
    <div class="relative max-w-4xl max-h-[90vh] overflow-hidden" @click.stop>
      <!-- Close button -->
      <UButton
        icon="i-heroicons-x-mark"
        variant="ghost"
        size="sm"
        class="absolute top-4 right-4 z-10 bg-white dark:bg-gray-800 rounded-full shadow-lg"
        @click="closeModal"
      />
      
      <!-- Image container -->
      <div class="relative overflow-hidden rounded-lg">
        <img 
          :src="fullImageUrl" 
          :alt="altText"
          class="max-w-full max-h-[80vh] object-contain select-none"
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
      
      <!-- Zoom controls -->
      <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// Props
interface Props {
  showModal: boolean
  imageUrl: string
  baseUrl?: string
  altText?: string
}

const props = withDefaults(defineProps<Props>(), {
  baseUrl: 'http://localhost:8000',
  altText: 'Vista previa de imagen'
})

// Emits
const emit = defineEmits<{
  close: []
}>()

// State
const imageScale = ref(1)
const imagePosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const dragOffset = ref({ x: 0, y: 0 })

// Computed
const fullImageUrl = computed(() => {
  if (!props.imageUrl) return ''
  
  // Si la URL ya incluye el protocolo, la usamos tal como está
  if (props.imageUrl.startsWith('http://') || props.imageUrl.startsWith('https://')) {
    return props.imageUrl
  }
  
  // Si no, agregamos el baseUrl
  return `${props.baseUrl}${props.imageUrl}`
})

// Methods
const closeModal = () => {
  emit('close')
  resetImage()
}

const handleModalClick = () => {
  closeModal()
}

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

// Watch for modal visibility changes to reset image
watch(() => props.showModal, (newValue) => {
  if (newValue) {
    resetImage()
  }
})
</script>