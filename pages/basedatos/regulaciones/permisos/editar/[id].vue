<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <UButton label="Volver" icon="i-heroicons-arrow-left" variant="outline" @click="goBack" class="mr-4" />
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <UIcon name="i-heroicons-pencil-square" class="text-green-600 mr-3 text-2xl" />
              Editar Regulación de Permiso
            </h1>
            <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Modifica la información del permiso
            </p>
          </div>
        </div>
        <UButton 
          label="Guardar" 
          icon="i-heroicons-document-arrow-down" 
          color="primary" 
          @click="saveForm"
          :loading="isSubmitting"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
      <p class="text-gray-600">Cargando permiso...</p>
    </div>

    <!-- Form -->
    <UCard v-else>
      <div class="space-y-6">
        <!-- Entity -->
        <div class="max-w-md">
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <UIcon name="i-heroicons-building-office" class="mr-1" />
              Entidad
            </label>
            <CreateEntityButton @entity-created="createEntity" />
          </div>
          <USelect v-model="formData.entidad" :items="entityOptions" :loading="loadingEntities"
            placeholder="Seleccionar entidad" class="w-full" />
        </div>

        <!-- Permit Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <UIcon name="i-heroicons-tag" class="mr-1" />
            Nombre del permiso
          </label>
          <UInput v-model="formData.nombrePermiso" placeholder="Nombre del permiso para el producto seleccionado"
            class="w-full" />
        </div>

        <!-- Code, Base Cost, and Processor Cost -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <UIcon name="i-heroicons-qr-code" class="mr-1" />
              C. Permiso
            </label>
            <UInput v-model="formData.codigoPermiso" placeholder="PRM-2024-001" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <UIcon name="i-heroicons-currency-dollar" class="mr-1" />
              Costo Base
            </label>
            <UInput v-model="formData.costoBase" type="number" step="0.01" placeholder="90.00" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <UIcon name="i-heroicons-user" class="mr-1" />
              C. Tramitador
            </label>
            <UInput v-model="formData.costoTramitador" type="number" step="0.01" placeholder="50.00" class="w-full" />
          </div>
        </div>

        <!-- Documents Upload -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Documentos
            </label>
            <UButton label="Agregar documento" icon="i-heroicons-plus" size="xs" @click="addDocumentSlot" />
          </div>
          
          <!-- Existing documents -->
          <div v-if="existingDocuments.length > 0" class="mb-4">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Documentos existentes:</h4>
            <div class="w-full overflow-x-auto">
              <div class="flex gap-3" style="display: flex; flex-direction: row; flex-wrap: nowrap; min-width: max-content;">
                <div v-for="doc in existingDocuments" :key="doc.id"
                  class="flex-shrink-0 w-32 h-32 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 relative"
                  style="flex-shrink: 0; width: 128px; height: 128px; min-width: 128px;">
                  <div class="text-center">
                    <UIcon name="i-heroicons-document" class="w-8 h-8 text-blue-500 mx-auto mb-1" />
                    <span class="text-xs text-gray-600">{{ doc.nombre_original }}</span>
                  </div>
                  <UButton
                    icon="i-heroicons-x-mark"
                    variant="ghost"
                    size="xs"
                    color="error"
                    class="absolute top-1 right-1"
                    @click="removeExistingDocument(doc.id)"
                    title="Eliminar documento"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <!-- New documents -->
          <div class="w-full overflow-x-auto">
            <div class="flex gap-3" style="display: flex; flex-direction: row; flex-wrap: nowrap; min-width: max-content;">
              <div v-for="(slot, index) in documentSlots" :key="index"
                class="flex-shrink-0 w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                style="flex-shrink: 0; width: 128px; height: 128px; min-width: 128px;"
                @click="selectDocument(index)">
                <div v-if="!slot.file" class="text-center">
                  <UIcon name="i-heroicons-document" class="w-8 h-8 text-gray-400 mx-auto mb-1" />
                  <span class="text-xs text-gray-500">Agregar documento</span>
                </div>
                <div v-else class="text-center">
                  <UIcon name="i-heroicons-document-check" class="w-8 h-8 text-green-500 mx-auto mb-1" />
                  <span class="text-xs text-gray-600">{{ slot.file.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Observations -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Observaciones
          </label>
          <UTextarea v-model="formData.observaciones" placeholder="Agregar observaciones sobre el permiso..." :rows="3"
            class="w-full" />
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {EntityService} from '~/services/entityService'
import { type CreateEntityRequest } from '~/services/entityService'
import {PermisoService} from '~/services/permisoService'
import { type CreatePermisoRequest } from '~/services/permisoService'


// Interface temporal para la respuesta real del backend
interface PermisoResponse {
  id: number
  id_entidad_reguladora: number
  nombre: string
  c_permiso: number
  c_tramitador: number
  observaciones: string
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

// Loading states
const loading = ref(true)
const isSubmitting = ref(false)

// Form data
const formData = ref({
  entidad: '',
  nombrePermiso: '',
  codigoPermiso: '',
  costoBase: '',
  costoTramitador: '',
  observaciones: ''
})

// Entity options
const entityOptions = ref([
  { label: 'MTC', value: 'MTC' },
  { label: 'MINSA', value: 'MINSA' },
  { label: 'PRODUCE', value: 'PRODUCE' },
  { label: 'MINCETUR', value: 'MINCETUR' }
])

// Loading state for entities
const loadingEntities = ref(false)

// Document slots
interface DocumentSlot {
  file: File | null
}

const documentSlots = ref<DocumentSlot[]>([
  { file: null }
])

// Existing documents
const existingDocuments = ref<Array<{
  id: number
  nombre_original: string
  ruta: string
}>>([])

// Documents to delete
const documentsToDelete = ref<number[]>([])



// Methods
const goBack = () => {
  // Redirigir a la página de regulaciones con el tab de permisos seleccionado
  router.push('/basedatos/regulaciones?tab=permisos')
}

const addDocumentSlot = () => {
  documentSlots.value.push({ file: null })
}

const selectDocument = (index: number) => {
  // Crear un input file oculto
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png'

  input.onchange = (event) => {
    const target = event.target as HTMLInputElement
    if (target.files && target.files[0]) {
      const file = target.files[0]
      documentSlots.value[index] = { file: file }
    }
  }

  input.click()
}

const removeExistingDocument = (documentId: number) => {
  // Agregar a la lista de documentos a eliminar
  documentsToDelete.value.push(documentId)
  // Remover de la lista de documentos existentes
  existingDocuments.value = existingDocuments.value.filter(doc => doc.id !== documentId)
}

const loadPermiso = async () => {
  try {
    const permisoId = parseInt(route.params.id as string)
    
    
    const response = await PermisoService.getPermisoById(permisoId)
    
    
    if (response.success && response.data) {
      const permiso = response.data as unknown as PermisoResponse
      
      // Mapear datos del backend al formulario según la respuesta real
      formData.value = {
        entidad: permiso.id_entidad_reguladora?.toString() || '',
        nombrePermiso: permiso.nombre || '',
        codigoPermiso: permiso.c_permiso?.toString() || '',
        costoBase: permiso.c_permiso?.toString() || '',
        costoTramitador: permiso.c_tramitador?.toString() || '',
        observaciones: permiso.observaciones || ''
      }
      
      // Cargar documentos existentes desde media
      if (permiso.media && permiso.media.length > 0) {
        existingDocuments.value = permiso.media.map((doc) => ({
          id: doc.id,
          nombre_original: doc.nombre_original,
          ruta: doc.ruta
        }))
        
        
      } else {
        
        existingDocuments.value = []
      }
      
      
      
    } else {
      console.error('Error al cargar el permiso:', response.error)
      alert('Error al cargar el permiso: ' + response.error)
    }
  } catch (error) {
    console.error('Error al cargar el permiso:', error)
    alert('Error al cargar el permiso')
  } finally {
    loading.value = false
  }
}

const validateForm = () => {
  if (!formData.value.entidad || !formData.value.nombrePermiso || !formData.value.codigoPermiso) {
    alert('Los campos entidad, nombre del permiso y código del permiso son requeridos')
    return false
  }
  return true
}

const saveForm = async () => {
  if (!validateForm()) {
    return
  }
  
  isSubmitting.value = true
  
  try {
    const permisoId = parseInt(route.params.id as string)
    
    // Crear FormData para manejar archivos
    const formDataToSend = new FormData()
    
    // Agregar el ID de la regulación para indicar que es una actualización
    formDataToSend.append('id_regulacion', permisoId.toString())
    
    // Agregar campos de texto
    formDataToSend.append('entidad_id', formData.value.entidad)
    formDataToSend.append('nombre_permiso', formData.value.nombrePermiso)
    formDataToSend.append('codigo_permiso', formData.value.codigoPermiso)
    formDataToSend.append('costo_base', formData.value.costoBase)
    formDataToSend.append('costo_tramitador', formData.value.costoTramitador)
    
    if (formData.value.observaciones) {
      formDataToSend.append('observaciones', formData.value.observaciones)
    }
    
    // Agregar IDs de documentos a eliminar
    if (documentsToDelete.value.length > 0) {
      documentsToDelete.value.forEach(docId => {
        formDataToSend.append('documentos_eliminar[]', docId.toString())
      })
    }
    
    // Agregar nuevos documentos si existen
    documentSlots.value.forEach((slot, index) => {
      if (slot.file) {
        formDataToSend.append(`documentos[${index}]`, slot.file)
      }
    })
    
    for (let [key, value] of formDataToSend.entries()) {
      
    }
    
    const response = await PermisoService.updatePermiso(permisoId, formDataToSend)
    
    if (response.success) {
      
      router.push('/basedatos/regulaciones?tab=permisos')
    } else {
      console.error('Error al actualizar el permiso:', response.error)
      alert('Error al actualizar el permiso: ' + response.error)
    }
  } catch (err) {
    console.error('Error updating permiso:', err)
    alert('Error al actualizar el permiso')
  } finally {
    isSubmitting.value = false
  }
}

const loadEntities = async () => {
  try {
    loadingEntities.value = true
    const response = await EntityService.getEntities()

    if (response.success && response.data) {
      // Convertir las entidades a formato de opciones
      entityOptions.value = response.data.map(entity => ({
        label: entity.nombre,
        value: entity.id.toString()
      }))
      
    } else {
      console.error('Error al cargar entidades:', response.error)
    }
  } catch (error) {
    console.error('Error al cargar entidades:', error)
  } finally {
    loadingEntities.value = false
  }
}

const createEntity = async (entity: { nombre: string; descripcion: string }) => {
  try {
    

    // Validar campos requeridos
    if (!entity.nombre || !entity.descripcion) {
      console.error('Todos los campos son requeridos')
      return
    }

    // Crear objeto para la API
    const entityData: CreateEntityRequest = {
      nombre: entity.nombre,
      descripcion: entity.descripcion,
    }

    // Llamar al servicio para crear la entidad
    const response = await EntityService.createEntity(entityData)

    if (response.success && response.data) {
      // Agregar la nueva entidad a las opciones
      entityOptions.value.push({
        label: response.data.nombre,
        value: response.data.id.toString()
      })

      
    } else {
      console.error('Error al crear entidad:', response.error)
    }

  } catch (error) {
    console.error('Error al crear entidad:', error)
  }
}

// Cargar datos al inicializar
onMounted(async () => {
  await Promise.all([
    loadEntities(),
    loadPermiso()
  ])
})
</script> 