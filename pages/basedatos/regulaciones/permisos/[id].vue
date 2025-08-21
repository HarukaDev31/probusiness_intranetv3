<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <UButton label="Volver" icon="i-heroicons-arrow-left" variant="outline" @click="goBack" class="mr-4" />
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <UIcon name="i-heroicons-document-text" class="text-green-600 mr-3 text-2xl" />
              Detalle de Permiso
            </h1>
            
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-green-600" />
      <span class="ml-2 text-gray-600">Cargando permiso...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error al cargar el permiso</h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">{{ error }}</p>
      <UButton label="Intentar de nuevo" @click="loadPermiso" />
    </div>

    <!-- Content -->
    <div v-else-if="permiso" class="space-y-6">
      <!-- Observations Card -->
      <UCard v-if="permiso.observaciones">
        <template #header>
          <div class="flex items-center">
            <UIcon name="i-heroicons-chat-bubble-left-right" class="text-green-600 mr-2" />
            <h3 class="text-lg font-semibold">Comentarios</h3>
          </div>
        </template>

        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ permiso.observaciones }}</p>
        </div>
      </UCard>

      <!-- Documents Card -->
      <UCard v-if="permiso.media && permiso.media.length > 0">
        <template #header>
          <div class="flex items-center">
            <UIcon name="i-heroicons-document" class="text-green-600 mr-2" />
            <h3 class="text-lg font-semibold">Documentos ({{ permiso.media.length }})</h3>
          </div>
        </template>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="(mediaItem, index) in permiso.media" 
            :key="mediaItem.id"
            class="relative group cursor-pointer border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-green-500 transition-colors"
            @click="openDocumentModal(mediaItem)"
          >
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <UIcon 
                  name="getDocumentIcon(mediaItem.extension)" 
                  class="w-12 h-12 text-green-600"
                />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ mediaItem.nombre_original }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatFileSize(mediaItem.peso) }} • {{ mediaItem.extension.toUpperCase() }}
                </p>
              </div>
              <div class="flex-shrink-0">
                <UIcon 
                  name="i-heroicons-arrow-top-right-on-square" 
                  class="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- No content message -->
      <UCard v-if="!permiso.observaciones && (!permiso.media || permiso.media.length === 0)">
        <div class="text-center py-8">
          <UIcon name="i-heroicons-information-circle" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Sin contenido adicional</h3>
          <p class="text-gray-600 dark:text-gray-400">
            Este permiso no tiene observaciones ni documentos asociados.
          </p>
        </div>
      </UCard>
    </div>

    <!-- Document Modal -->
    <div v-if="showDocumentModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click="closeDocumentModal">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-hidden" @click.stop>
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center">
            <UIcon name="getDocumentIcon(selectedDocument?.extension)" class="w-8 h-8 text-green-600 mr-3" />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ selectedDocument?.nombre_original }}
            </h3>
          </div>
          <UButton
            icon="i-heroicons-x-mark"
            variant="ghost"
            size="sm"
            @click="closeDocumentModal"
          />
        </div>

        <!-- Document Preview -->
        <div class="max-h-[70vh] overflow-auto">
          <div v-if="selectedDocument" class="text-center">
            <!-- PDF Preview -->
            <iframe 
              v-if="selectedDocument.extension === 'pdf'"
              :src="getDocumentUrl(selectedDocument.ruta)"
              class="w-full h-96 border border-gray-300 rounded-lg"
              frameborder="0"
            ></iframe>
            
            <!-- Image Preview -->
            <img 
              v-else-if="['jpg', 'jpeg', 'png', 'gif'].includes(selectedDocument.extension)"
              :src="getDocumentUrl(selectedDocument.ruta)"
              :alt="selectedDocument.nombre_original"
              class="max-w-full max-h-96 mx-auto border border-gray-300 rounded-lg"
            />
            
            <!-- Other file types -->
            <div v-else class="py-12">
              <UIcon name="getDocumentIcon(selectedDocument.extension)" class="w-24 h-24 text-green-600 mx-auto mb-4" />
              <p class="text-gray-600 dark:text-gray-400 mb-4">
                Vista previa no disponible para archivos .{{ selectedDocument.extension }}
              </p>
              <UButton 
                label="Descargar documento" 
                icon="i-heroicons-arrow-down-tray"
                @click="downloadDocument(selectedDocument)"
              />
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-500 dark:text-gray-400">
            <p>Tamaño: {{ formatFileSize(selectedDocument?.peso || 0) }}</p>
            <p>Formato: {{ selectedDocument?.extension?.toUpperCase() }}</p>
          </div>
          <div class="flex space-x-2">
            <UButton 
              label="Descargar" 
              icon="i-heroicons-arrow-down-tray"
              variant="outline"
              @click="downloadDocument(selectedDocument)"
            />
            <UButton 
              label="Cerrar" 
              @click="closeDocumentModal"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {PermisoService} from '~/services/permisoService'

// Interface temporal para la respuesta real del backend
interface PermisoResponse {
  id: number
  id_entidad_reguladora: number
  nombre: string
  c_permiso: number
  c_tramitador: number
  observaciones: string
  estado: string
  created_at: string
  updated_at: string
  rubro: any
  entidad_reguladora: {
    id: number
    nombre: string
    descripcion: string
    created_at: string
    updated_at: string
  }
  media: Array<{
    id: number
    id_regulacion: number
    extension: string
    peso: number
    nombre_original: string
    ruta: string
    created_at: string
    updated_at: string
  }>
}

// Router and Route
const router = useRouter()
const route = useRoute()

// Service instances

// Reactive data
const permiso = ref<PermisoResponse | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Modal state
const showDocumentModal = ref(false)
const selectedDocument = ref<PermisoResponse['media'][0] | null>(null)

// Methods
const goBack = () => {
  router.push('/basedatos/regulaciones?tab=permisos')
}

const loadPermiso = async () => {
  loading.value = true
  error.value = null
  
  try {
    const permisoId = parseInt(route.params.id as string)
    const response = await PermisoService.getPermisoById(permisoId)
    
    if (response.success && response.data) {
      permiso.value = response.data as unknown as PermisoResponse
      console.log('Permiso cargado:', permiso.value)
    } else {
      error.value = response.error || 'No se pudo cargar el permiso'
    }
  } catch (err) {
    console.error('Error loading permiso:', err)
    error.value = 'Error al cargar el permiso'
  } finally {
    loading.value = false
  }
}

const getDocumentIcon = (extension: string) => {
  switch (extension?.toLowerCase()) {
    case 'pdf':
      return 'i-heroicons-document-text'
    case 'doc':
    case 'docx':
      return 'i-heroicons-document'
    case 'xls':
    case 'xlsx':
      return 'i-heroicons-table-cells'
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return 'i-heroicons-photo'
    default:
      return 'i-heroicons-document'
  }
}


const getDocumentUrl = (ruta: string) => {
  const config = useRuntimeConfig()
  return `${config.public.apiBaseUrl}/storage/${ruta}`
}

const openDocumentModal = (document: PermisoResponse['media'][0]) => {
  selectedDocument.value = document
  showDocumentModal.value = true
}

const closeDocumentModal = () => {
  showDocumentModal.value = false
  selectedDocument.value = null
}

const downloadDocument = (doc: PermisoResponse['media'][0] | null) => {
  if (!doc) return
  
  const link = document.createElement('a')
  link.href = getDocumentUrl(doc.ruta)
  link.download = doc.nombre_original
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Load permiso on mount
onMounted(() => {
  loadPermiso()
})
</script> 