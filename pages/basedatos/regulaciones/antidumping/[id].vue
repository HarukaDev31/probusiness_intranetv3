<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <UButton label="Volver" icon="i-heroicons-arrow-left" variant="outline" @click="goBack" class="mr-4" />
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <UIcon name="i-heroicons-shield-check" class="text-blue-600 mr-3 text-2xl" />
              Detalle de Regulación Antidumping
            </h1>
           
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-blue-600" />
      <span class="ml-2 text-gray-600">Cargando regulación...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error al cargar la regulación</h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">{{ error }}</p>
      <UButton label="Intentar de nuevo" @click="loadRegulation" />
    </div>

    <!-- Content -->
    <div v-else-if="regulation" class="space-y-6">
      <!-- Observations Card -->
      <UCard v-if="regulation.observaciones">
        <template #header>
          <div class="flex items-center">
            <UIcon name="i-heroicons-chat-bubble-left-right" class="text-blue-600 mr-2" />
            <h3 class="text-lg font-semibold">Comentarios</h3>
          </div>
        </template>

        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <p class="text-gray-700 dark:text-gray-300 text-wrap" style="word-break: break-word;" title="{{ regulation.observaciones }}">{{ regulation.observaciones }}</p>
        </div>
      </UCard>

      <!-- Images Card -->
      <UCard v-if="regulation.media && regulation.media.length > 0">
        <template #header>
          <div class="flex items-center">
            <UIcon name="i-heroicons-photo" class="text-blue-600 mr-2" />
            <h3 class="text-lg font-semibold">Imágenes ({{ regulation.media.length }})</h3>
          </div>
        </template>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="(mediaItem, index) in regulation.media" 
            :key="mediaItem.id"
            class="relative group cursor-pointer"
            @click="openImageModal(getImageUrl(mediaItem.ruta))"
          >
            <img 
              :src="mediaItem.ruta" 
              :alt="mediaItem.nombre_original"
              class="w-full h-48  rounded-lg border-2 border-gray-200 dark:border-gray-700 group-hover:border-blue-500 transition-colors"
            />
            <div class="absolute inset-0  bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
              <UIcon 
                name="i-heroicons-magnifying-glass-plus" 
                class="text-white opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8"
              />
            </div>
            <div class="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              {{ mediaItem.nombre_original }}
            </div>
          </div>
        </div>
      </UCard>

      <!-- No content message -->
      <UCard v-if="!regulation.observaciones && (!regulation.media || regulation.media.length === 0)">
        <div class="text-center py-8">
          <UIcon name="i-heroicons-information-circle" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Sin contenido adicional</h3>
          <p class="text-gray-600 dark:text-gray-400">
            Esta regulación no tiene observaciones ni imágenes asociadas.
          </p>
        </div>
            </UCard>
    </div>

    <!-- Image Modal -->
    <div v-if="showImageModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click="closeImageModal">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-hidden" @click.stop>
        <!-- Header with controls -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Vista Ampliada</h3>
          <div class="flex items-center gap-2">
            <!-- Zoom Controls -->
            <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <UButton 
                icon="i-heroicons-minus"
                variant="ghost"
                size="xs"
                @click="zoomOut"
                :disabled="imageZoom <= 0.5"
                title="Reducir zoom"
              />
              <span class="text-sm font-medium min-w-[3rem] text-center">
                {{ Math.round(imageZoom * 100) }}%
              </span>
              <UButton 
                icon="i-heroicons-plus"
                variant="ghost"
                size="xs"
                @click="zoomIn"
                :disabled="imageZoom >= 3"
                title="Aumentar zoom"
              />
            </div>
            
            <UButton 
              icon="i-heroicons-arrow-path"
              variant="ghost"
              size="xs"
              @click="resetZoom"
              title="Restablecer zoom"
            />
            
            <UButton 
              icon="i-heroicons-x-mark"
              variant="ghost"
              @click="closeImageModal"
              title="Cerrar"
            />
          </div>
        </div>
        
        <!-- Image Container -->
        <div 
          class="flex justify-center items-center overflow-hidden select-none"
          :class="{ 'cursor-grab': imageZoom > 1 && !isDragging, 'cursor-grabbing': isDragging }"
          @wheel="handleWheel"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseLeave"
          @dragstart.prevent
          @selectstart.prevent
          style="height: calc(90vh - 120px);"
        >
          <img 
            v-if="selectedImage"
            :src="selectedImage" 
            alt="Imagen ampliada"
            class="select-none"
            :class="{ 'transition-transform duration-200 ease-out': !isDragging }"
            :style="{
              transform: `scale(${imageZoom}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
              maxWidth: imageZoom > 1 ? 'none' : '100%',
              maxHeight: imageZoom > 1 ? 'none' : '100%'
            }"
            @dragstart.prevent
            @selectstart.prevent
            draggable="false"
          />
        </div>
        
        <!-- Zoom Instructions -->
        <div class="text-center text-sm text-gray-500 mt-2">
          <p>Usa la rueda del mouse para hacer zoom • Arrastra para mover la imagen • Botones para controlar zoom</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useOverlay } from '#imports'
import AntidumpingService from '~/services/antidumpingService'

// Types
interface AntidumpingMedia {
  id: number
  id_regulacion: number
  extension: string
  peso: number
  nombre_original: string
  ruta: string
  created_at: string
  updated_at: string
}

interface ProductRubro {
  id: number
  nombre: string
  created_at: string
  updated_at: string
}

interface AntidumpingRegulation {
  id: number
  id_rubro: number
  descripcion_producto: string
  partida: string
  antidumping: string
  observaciones?: string
  created_at: string
  updated_at: string
  rubro: ProductRubro
  media: AntidumpingMedia[]
}

// Route and router
const route = useRoute()
const router = useRouter()

// Service instance
const antidumpingService = AntidumpingService.getInstance()

// Reactive data
const regulation = ref<AntidumpingRegulation | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const selectedImage = ref<string | null>(null)
const showImageModal = ref(false)
const imageZoom = ref(1)
const imagePosition = ref({ x: 0, y: 0 })

// Get regulation ID from route
const regulationId = parseInt(route.params.id as string)

// Methods
const goBack = () => {
  router.push('/basedatos/regulaciones?tab=antidumping')
}

const loadRegulation = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await antidumpingService.getAntidumpingById(regulationId)

    if (response.success && response.data) {
      regulation.value = {
        id: response.data.id,
        id_rubro: response.data.id_rubro,
        descripcion_producto: response.data.descripcion_producto,
        partida: response.data.partida,
        antidumping: response.data.antidumping.toString(),
        observaciones: response.data.observaciones,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
        rubro: response.data.rubro,
        media: response.data.media || []
      }
    } else {
      error.value = response.error || 'No se pudo cargar la regulación'
    }
  } catch (err) {
    console.error('Error loading regulation:', err)
    error.value = 'Error al cargar la regulación'
  } finally {
    loading.value = false
  }
}

const openImageModal = (imageUrl: string) => {
  selectedImage.value = imageUrl
  showImageModal.value = true
  // Reset zoom and position when opening
  imageZoom.value = 1
  imagePosition.value = { x: 0, y: 0 }
  isDragging.value = false
  dragStart.value = { x: 0, y: 0 }
  dragOffset.value = { x: 0, y: 0 }
}

const closeImageModal = () => {
  showImageModal.value = false
  selectedImage.value = null
  // Reset zoom and position when closing
  imageZoom.value = 1
  imagePosition.value = { x: 0, y: 0 }
  isDragging.value = false
  dragStart.value = { x: 0, y: 0 }
  dragOffset.value = { x: 0, y: 0 }
}

const zoomIn = () => {
  if (imageZoom.value < 3) {
    imageZoom.value += 0.25
  }
}

const zoomOut = () => {
  if (imageZoom.value > 0.5) {
    imageZoom.value -= 0.25
  }
}

const resetZoom = () => {
  imageZoom.value = 1
  imagePosition.value = { x: 0, y: 0 }
}

const handleWheel = (event: WheelEvent) => {
  event.preventDefault()
  if (event.deltaY < 0) {
    zoomIn()
  } else {
    zoomOut()
  }
}

// Drag functionality
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const dragOffset = ref({ x: 0, y: 0 })

const handleMouseDown = (event: MouseEvent) => {
  if (imageZoom.value > 1) {
    event.preventDefault()
    event.stopPropagation()
    isDragging.value = true
    dragStart.value = { x: event.clientX, y: event.clientY }
    dragOffset.value = { ...imagePosition.value }
  }
}

const handleMouseMove = (event: MouseEvent) => {
  if (isDragging.value && imageZoom.value > 1) {
    event.preventDefault()
    event.stopPropagation()
    
    const deltaX = event.clientX - dragStart.value.x
    const deltaY = event.clientY - dragStart.value.y
    
    // Aplicar el movimiento directamente sin escalado adicional
    imagePosition.value = {
      x: dragOffset.value.x + deltaX,
      y: dragOffset.value.y + deltaY
    }
  }
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleMouseLeave = () => {
  isDragging.value = false
}

const getImageUrl = (ruta: string) => {
    return ruta
}

// Load regulation on mount
onMounted(() => {
  if (isNaN(regulationId)) {
    error.value = 'ID de regulación inválido'
    loading.value = false
    return
  }

  loadRegulation()
})
</script>