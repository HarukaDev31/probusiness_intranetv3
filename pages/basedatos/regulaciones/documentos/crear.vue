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
              <UIcon name="i-heroicons-plus-circle" class="text-blue-600 mr-3 text-2xl" />
              Nuevo Documento Especial
            </h1>
            <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Completa la información del nuevo documento especial
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

    <!-- Form -->
    <UCard>
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



        <!-- Documents Upload -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Documentos
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
              class="flex-shrink-0 w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
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
import ProductRubroService from '~/services/productRubroService'
import DocumentoService, { type CreateDocumentoRequest } from '~/services/documentoService'
import type { ProductRubro } from '~/types/product-rubro'

// Router
const router = useRouter()

// Service instances
const productRubroService = ProductRubroService.getInstance()
const documentoService = DocumentoService.getInstance()

// Form data
const formData = ref({
  producto: null as any,
  observaciones: ''
})

// Validation errors
const validationErrors = ref({
  producto: ''
})

// Loading state for form submission
const isSubmitting = ref(false)

// Product options (reactive)
const productOptions = ref<{ label: string; value: string; }[]>([])

// Modal state
const showCreateProductModal = ref(false)

// Loading state
const loadingProducts = ref(false)

// New product form
const newProduct = ref({
  nombre: ''
})



// Document slots
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

// Methods
const goBack = () => {
  // Redirigir a la página de regulaciones con el tab de documentos seleccionado
  router.push('/basedatos/regulaciones?tab=documentos')
}

const searchProducts = async (searchTerm: string) => {
  try {
    loadingProducts.value = true
    const response = await productRubroService.getProductRubros(searchTerm,'DOCUMENTO_ESPECIAL')

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
    const response = await productRubroService.createProductRubro({
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
      console.log('Rubro creado exitosamente:', response.data)
    } else {
      console.error('Error al crear rubro:', response.error)
    }
  } catch (error) {
    console.error('Error al crear producto:', error)
  }
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

const saveForm = async () => {
  try {
    // Validar formulario completo
    if (!validateForm()) {
      console.error('Formulario tiene errores de validación')
      return
    }
    
    isSubmitting.value = true
    console.log('Guardando documento especial:', formData.value)
    console.log('Documentos:', documentSlots.value)

    // Preparar datos para la API
    const documentoData: CreateDocumentoRequest = {
      id_rubro: parseInt(formData.value.producto.value),
      observaciones: formData.value.observaciones || undefined,
      documentos: documentSlots.value
        .filter(slot => slot.file)
        .map(slot => slot.file!)
    }

    // Llamar al servicio para crear el documento especial
    const response = await documentoService.createDocumento(documentoData)

    if (response.success && response.data) {
      console.log('Documento especial guardado exitosamente:', response.data)
      
      // Mostrar notificación de éxito (aquí podrías usar un toast o notificación)
      
      // Redirigir de vuelta a la lista
      router.push('/basedatos/regulaciones?tab=documentos')
    } else {
      console.error('Error al guardar documento especial:', response.error)
      // Aquí podrías mostrar un mensaje de error al usuario
    }

  } catch (error) {
    console.error('Error al guardar:', error)
    // Aquí podrías mostrar un mensaje de error al usuario
  } finally {
    isSubmitting.value = false
  }
}

// Cargar productos al inicializar
onMounted(() => {
  searchProducts('')
})
</script> 