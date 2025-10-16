<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <UButton 
            label="Volver" 
            icon="i-heroicons-arrow-left"
            variant="outline"
            @click="goBack"
            class="mr-4"
          />
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <UIcon name="i-heroicons-pencil-square" class="text-green-600 mr-3 text-2xl" />
              Editar Documento Especial
            </h1>
            <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Modifica la información del documento especial
            </p>
          </div>
        </div>
        <UButton 
          label="Guardar" 
          icon="i-heroicons-document-arrow-down"
          color="primary"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          @click="saveForm"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-6">
      <UCard>
        <div class="space-y-4">
          <div class="animate-pulse">
            <div class="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div class="h-10 bg-gray-200 rounded"></div>
          </div>
          <div class="animate-pulse">
            <div class="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div class="h-32 bg-gray-200 rounded"></div>
          </div>
          <div class="animate-pulse">
            <div class="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div class="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Form -->
    <UCard v-else>
      <div class="space-y-6">
        <!-- Product Selector -->
        <div class="max-w-md">
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <UIcon name="i-heroicons-magnifying-glass" class="mr-1" />
              Producto Seleccionado
              <span class="text-red-500 ml-1">*</span>
            </label>
            <UModal v-model="showCreateProductModal" title="Crear Nuevo Producto" :triger="true">
              <UButton label="Crear Producto" icon="i-heroicons-plus" size="xs" variant="outline"
                @click="showCreateProductModal = true" />
              <template #body>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre del Producto
                    </label>
                    <UInput v-model="newProduct.nombre" placeholder="Ej: Zapatillas deportivas" class="w-full" />
                  </div>
                </div>
              </template>

              <template #footer="{ close }">
                <div class="flex justify-end gap-3">
                  <UButton label="Cancelar" variant="outline" @click="close" />
                  <UButton label="Crear Producto" color="primary" @click="() => {
                    createProduct();
                    close();
                  }" />
                </div>
              </template>
            </UModal>
          </div>
          <UInputMenu 
            v-model="formData.producto" 
            :items="productOptions" 
            :loading="loadingProducts"
            placeholder="Buscar producto..." 
            class="w-full" 
            :color="validationErrors.producto ? 'error' : undefined"
            @update:searchTerm="searchProducts"
            @update:model-value="clearFieldError('producto')"
          />
          <p v-if="validationErrors.producto" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ validationErrors.producto }}
          </p>
        </div>

        <!-- Existing Documents -->
        <div v-if="existingDocuments.length > 0">
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Documentos Existentes
            </label>
            <div class="flex gap-2">
              <UButton 
                label="Eliminar seleccionados" 
                icon="i-heroicons-trash"
                size="xs"
                color="error"
                variant="outline"
                @click="deleteSelectedDocuments"
                :disabled="documentsToDelete.length === 0"
              />
              <UButton 
                label="Deseleccionar todas" 
                icon="i-heroicons-x-mark"
                size="xs"
                variant="outline"
                @click="deselectAllDocuments"
                :disabled="documentsToDelete.length === 0"
              />
            </div>
          </div>
          <div class="flex gap-3 overflow-x-auto pb-2">
            <div 
              v-for="(documento, index) in existingDocuments" 
              :key="index"
              class="relative flex-shrink-0 w-32 h-32 border-2 rounded-lg flex items-center justify-center transition-all cursor-pointer"
              :class="documentsToDelete.includes(index) 
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                : 'border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700'"
              @click="toggleDocumentDelete(index)"
            >
              <div class="text-center">
                <UIcon name="i-heroicons-document" class="w-8 h-8 text-gray-400 mx-auto mb-1" />
                <span class="text-xs text-gray-500">{{ getFileName(documento) }}</span>
              </div>
              <div v-if="documentsToDelete.includes(index)" class="absolute top-1 right-1">
                <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        <!-- New Documents Upload -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nuevos Documentos
            </label>
            <UButton 
              label="Agregar documento" 
              icon="i-heroicons-plus"
              size="xs"
              @click="addDocumentSlot"
            />
          </div>
          <div class="flex gap-3 overflow-x-auto pb-2">
            <div 
              v-for="(slot, index) in documentSlots" 
              :key="index"
              class="relative flex-shrink-0 w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              @click="selectDocument(index)"
            >
              <div v-if="!slot.file" class="text-center">
                <UIcon name="i-heroicons-document" class="w-8 h-8 text-gray-400 mx-auto mb-1" />
                <span class="text-xs text-gray-500">Agregar documento</span>
              </div>
              <div v-else class="text-center">
                <UIcon name="i-heroicons-document-check" class="w-8 h-8 text-green-500 mx-auto mb-1" />
                <span class="text-xs text-gray-600">{{ slot.file.name }}</span>
              </div>
                             <UButton
                 v-if="slot.file"
                 icon="i-heroicons-x-mark"
                 size="xs"
                 color="error"
                 variant="ghost"
                 class="absolute top-1 right-1"
                 @click.stop="removeDocumentSlot(index)"
               />
            </div>
          </div>
        </div>

        <!-- Observations -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Observaciones
          </label>
          <UTextarea 
            v-model="formData.observaciones"
            placeholder="Agregar observaciones sobre los documentos especiales..."
            :rows="3"
            class="w-full"
          />
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ProductRubroService } from '~/services/productRubroService'
import { DocumentoService, type CreateDocumentoRequest } from '~/services/documentoService'
import type { ProductRubro } from '~/types/product-rubro'

// Router and route
const router = useRouter()
const route = useRoute()
const regulationId = route.params.id as string

  

// Form data
const formData = ref({
  producto: null as any,
  observaciones: ''
})

// Validation errors
const validationErrors = ref({
  producto: ''
})

// Loading states
const loading = ref(true)
const isSubmitting = ref(false)
const loadingProducts = ref(false)

// Product options (reactive)
const productOptions = ref<{ label: string; value: string; }[]>([])

// Modal state
const showCreateProductModal = ref(false)

// New product form
const newProduct = ref({
  nombre: ''
})

// Existing documents
const existingDocuments = ref<string[]>([])
const documentsToDelete = ref<number[]>([])

// Document slots for new uploads
interface DocumentSlot {
  file: File | null
}

const documentSlots = ref<DocumentSlot[]>([
  { file: null }
])

// Validation methods
const validateField = (field: string, value: any): string => {
  switch (field) {
    case 'producto':
      return !value || !value.value ? 'Producto es requerido' : ''
    default:
      return ''
  }
}

const validateForm = (): boolean => {
  const errors = {
    producto: validateField('producto', formData.value.producto)
  }
  
  validationErrors.value = errors
  
  return !Object.values(errors).some(error => error !== '')
}

const clearFieldError = (field: string) => {
  validationErrors.value[field as keyof typeof validationErrors.value] = ''
}


const searchProducts = async (searchTerm: string) => {
  try {
    loadingProducts.value = true
    const response = await ProductRubroService.getProductRubros(searchTerm,'DOCUMENTO_ESPECIAL')

    if (response.success && response.data) {
      // Convertir productos a formato de opciones para autocomplete
      productOptions.value = response.data.map((productRubro: ProductRubro) => ({
        label: productRubro.nombre,
        value: productRubro.id.toString()
      }))
    }
  } catch (error) {
    console.error('Error searching products:', error)
  } finally {
    loadingProducts.value = false
  }
}

const createProduct = async () => {
  try {
    // Validar campo requerido
    if (!newProduct.value.nombre) {
      console.error('Nombre es requerido')
      return
    }
    const response = await ProductRubroService.createProductRubro({
      nombre: newProduct.value.nombre,
      tipo: 'DOCUMENTO_ESPECIAL'
    })
    if (response.success) {
      formData.value.producto = {
        label: response.data.nombre,
        value: response.data.id.toString()
      }
      newProduct.value = {
        nombre: ''
      }
      showCreateProductModal.value = false
      searchProducts('')
      
    } else {
      console.error('Error al crear rubro:', response.error)
    }
  } catch (error) {
    console.error('Error al crear producto:', error)
  }
}

// Document management methods
const toggleDocumentDelete = (index: number) => {
  const deleteIndex = documentsToDelete.value.indexOf(index)
  if (deleteIndex > -1) {
    documentsToDelete.value.splice(deleteIndex, 1)
  } else {
    documentsToDelete.value.push(index)
  }
}

const deleteSelectedDocuments = () => {
  // Eliminar documentos seleccionados visualmente
  documentsToDelete.value.forEach(index => {
    existingDocuments.value.splice(index, 1)
  })
  documentsToDelete.value = []
}

const deselectAllDocuments = () => {
  documentsToDelete.value = []
}

const getFileName = (filePath: string): string => {
  const parts = filePath.split('/')
  return parts[parts.length - 1] || 'Documento'
}

const addDocumentSlot = () => {
  documentSlots.value.push({ file: null })
}

const selectDocument = (index: number) => {
  // Crear un input file oculto
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.ppt,.pptx,.txt'
  
  input.onchange = (event) => {
    const target = event.target as HTMLInputElement
    if (target.files && target.files[0]) {
      const file = target.files[0]
      documentSlots.value[index] = { file: file }
    }
  }
  
  input.click()
}

const removeDocumentSlot = (index: number) => {
  documentSlots.value.splice(index, 1)
  // Asegurar que siempre haya al menos un slot vacío
  if (documentSlots.value.length === 0) {
    documentSlots.value.push({ file: null })
  }
}

// Load regulation data
const loadRegulation = async () => {
  try {
    loading.value = true
    const response = await DocumentoService.getDocumentoById(parseInt(regulationId))
    
    if (response.success && response.data) {
      // Buscar productos primero para poder establecer el producto seleccionado
      await searchProducts('')
      
      // Establecer datos del formulario
      formData.value = {
        producto: {
          label: response.data.rubro?.nombre || '',
          value: response.data.id_rubro.toString()
        },
        observaciones: response.data.observaciones || ''
      }
      
      // Cargar documentos existentes
      if (response.data.media && response.data.media.length > 0) {
        existingDocuments.value = response.data.media.map((media: any) => media.ruta)
      } else if (response.data.documentos && response.data.documentos.length > 0) {
        existingDocuments.value = response.data.documentos
      }
      
      
    } else {
      console.error('Error al cargar la regulación:', response.error)
    }
  } catch (error) {
    console.error('Error loading regulation:', error)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  // Redirigir a la página de regulaciones con el tab de documentos seleccionado
  router.push('/basedatos/regulaciones?tab=documentos')
}

const saveForm = async () => {
  try {
    // Validar formulario completo
    if (!validateForm()) {
      console.error('Formulario tiene errores de validación')
      return
    }
    
    isSubmitting.value = true
    

    // Preparar FormData para la API
    const formDataToSend = new FormData()
    
    // Agregar id_regulacion para indicar que es una actualización
    formDataToSend.append('id_regulacion', regulationId)
    
    // Agregar datos del formulario
    formDataToSend.append('id_rubro', formData.value.producto.value)
    
    if (formData.value.observaciones) {
      formDataToSend.append('observaciones', formData.value.observaciones)
    }
    
    // Agregar documentos a eliminar
    documentsToDelete.value.forEach(index => {
      formDataToSend.append('documentos_eliminar[]', index.toString())
    })
    
    // Agregar nuevos documentos
    documentSlots.value
      .filter(slot => slot.file)
      .forEach(slot => {
        formDataToSend.append('documentos[]', slot.file!)
      })

    // Llamar al servicio para actualizar el documento especial
    const response = await DocumentoService.updateDocumento(parseInt(regulationId), formDataToSend)

    if (response.success && response.data) {
      
      
      // Redirigir de vuelta a la lista
      router.push('/basedatos/regulaciones?tab=documentos')
    } else {
      console.error('Error al actualizar documento especial:', response.error)
    }

  } catch (error) {
    console.error('Error al guardar:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Cargar datos al inicializar
onMounted(() => {
  loadRegulation()
})
</script> 