<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <UButton label="Volver" icon="i-heroicons-arrow-left" variant="outline" @click="goBack" class="mr-4" />
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <UIcon name="i-heroicons-pencil-square" class="text-blue-600 mr-3 text-2xl" />
              Editar Regulación de Etiquetado
            </h1>
            <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Modificar información de la regulación de etiquetado
              <span class="text-red-500 ml-1">* Campos requeridos</span>
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
    <div v-if="loading">
      <!-- Header Skeleton -->
      <div class="mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="w-20 h-10 bg-gray-200 rounded-lg animate-pulse mr-4"></div>
            <div>
              <div class="w-64 h-8 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
              <div class="w-80 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div class="w-24 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>

      <!-- Form Skeleton -->
      <UCard>
        <div class="space-y-6">
          <!-- Product Selector Skeleton -->
          <div class="max-w-md">
            <div class="flex items-center justify-between mb-2">
              <div class="w-40 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div class="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div class="w-full h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          <!-- Description Skeleton -->
          <div>
            <div class="w-48 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div class="w-full h-24 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          <!-- Partida Skeleton -->
          <div>
            <div class="w-20 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div class="w-full h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          <!-- Observations Skeleton -->
          <div>
            <div class="w-28 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div class="w-full h-24 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error al cargar la regulación</h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">{{ error }}</p>
      <UButton label="Intentar de nuevo" @click="loadRegulation" />
    </div>

    <!-- Form -->
    <div v-else-if="regulation">
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

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción del Producto
              <span class="text-red-500 ml-1">*</span>
            </label>
            <UTextarea 
              v-model="formData.descripcion" 
              placeholder="Ingrese la descripción del producto..." 
              :rows="3"
              class="w-full" 
              :color="validationErrors.descripcion ? 'error' : undefined"
              @update:model-value="clearFieldError('descripcion')"
            />
            <p v-if="validationErrors.descripcion" class="mt-1 text-sm text-red-600 dark:text-red-400">
              {{ validationErrors.descripcion }}
            </p>
          </div>

          <!-- Partida -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Partida
              <span class="text-red-500 ml-1">*</span>
            </label>
            <UInput 
              v-model="formData.partida" 
              placeholder="Ej: 6402999000" 
              class="w-full" 
              :color="validationErrors.partida ? 'error' : undefined"
              @update:model-value="clearFieldError('partida')"
            />
            <p v-if="validationErrors.partida" class="mt-1 text-sm text-red-600 dark:text-red-400">
              {{ validationErrors.partida }}
            </p>
          </div>

          <!-- Observations -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Observaciones
            </label>
            <UTextarea v-model="formData.observaciones" placeholder="Agregar observaciones sobre el etiquetado..."
              :rows="3" class="w-full" />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import EtiquetadoService from '~/services/etiquetadoService'
import ProductRubroService from '~/services/productRubroService'

// Types
interface EtiquetadoRegulation {
  id: number
  id_rubro: number
  observaciones?: string
  imagenes?: string[]
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

interface ProductOption {
  label: string
  value: string
}

// Route and router
const route = useRoute()
const router = useRouter()

// Service instances
const etiquetadoService = EtiquetadoService.getInstance()
const productRubroService = ProductRubroService.getInstance()

// Reactive data
const regulation = ref<EtiquetadoRegulation | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const isSubmitting = ref(false)
const validationErrors = ref<Record<string, string>>({})

// Form data
const formData = ref({
  descripcion: '',
  partida: '',
  observaciones: '',
  producto: null as any
})

// Product selection
const productOptions = ref<ProductOption[]>([])
const loadingProducts = ref(false)
const showCreateProductModal = ref(false)
const creatingProduct = ref(false)
const newProduct = ref({
  nombre: ''
})

// Get regulation ID from route
const regulationId = parseInt(route.params.id as string)

// Methods
const goBack = () => {
  router.back()
}

const loadRegulation = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await etiquetadoService.getEtiquetadoById(regulationId)
    
          if (response.success && response.data) {
        regulation.value = {
          id: response.data.id,
          id_rubro: response.data.id_rubro,
          observaciones: response.data.observaciones,
          imagenes: response.data.imagenes,
          status: response.data.status,
          created_at: response.data.created_at,
          updated_at: response.data.updated_at
        }
        
        // Populate form data
        formData.value = {
          descripcion: '',
          partida: '',
          observaciones: regulation.value.observaciones || '',
          producto: null
        }
      
      // Load product options and set selected product
      await searchProducts('')
      
      // Find and set the selected product
      const selectedProduct = productOptions.value.find(p => p.value === regulation.value?.id_rubro.toString())
      if (selectedProduct) {
        formData.value.producto = selectedProduct
        console.log('Producto seleccionado:', selectedProduct)
      } else {
        console.warn('No se encontró el producto con ID:', regulation.value?.id_rubro)
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

const validateField = (field: string) => {
  const value = formData.value[field as keyof typeof formData.value]
  
  if (!value || value.toString().trim() === '') {
    validationErrors.value[field] = 'Este campo es requerido'
    return false
  }
  
  delete validationErrors.value[field]
  return true
}

const validateForm = () => {
  const fields = ['producto']
  let isValid = true
  
  fields.forEach(field => {
    if (!validateField(field)) {
      isValid = false
    }
  })
  
  return isValid
}

const clearFieldError = (field: string) => {
  delete validationErrors.value[field]
}

const searchProducts = async (query: string) => {
  loadingProducts.value = true
  
  try {
    const response = await productRubroService.getProductRubros(query)
    
    if (response.success && response.data) {
      productOptions.value = response.data.map(product => ({
        label: product.nombre,
        value: product.id.toString()
      }))
      console.log('Productos cargados:', productOptions.value.length)
    }
  } catch (err) {
    console.error('Error searching products:', err)
  } finally {
    loadingProducts.value = false
  }
}

const createProduct = async () => {
  if (!newProduct.value.nombre.trim()) {
    alert('El nombre del producto es requerido')
    return
  }
  
  creatingProduct.value = true
  
  try {
    const response = await productRubroService.createProductRubro({
      nombre: newProduct.value.nombre
    })
    
    if (response.success && response.data) {
      // Add new product to options
      productOptions.value.unshift({
        label: response.data.nombre,
        value: response.data.id.toString()
      })
      
      // Select the new product
      formData.value.producto = {
        label: response.data.nombre,
        value: response.data.id.toString()
      }
      
      // Reset form and close modal
      newProduct.value = { nombre: '' }
      showCreateProductModal.value = false
    } else {
      alert('Error al crear el producto: ' + response.error)
    }
  } catch (err) {
    console.error('Error creating product:', err)
    alert('Error al crear el producto')
  } finally {
    creatingProduct.value = false
  }
}

const saveForm = async () => {
  if (!validateForm()) {
    return
  }
  
  isSubmitting.value = true
  
  try {
    // Prepare the data object for the service
    const updateData: any = {
      id_rubro: parseInt(formData.value.producto?.value || '0')
    }
    
    if (formData.value.observaciones) {
      updateData.observaciones = formData.value.observaciones
    }
    
    console.log('Enviando datos de actualización:', updateData)
    
    const response = await etiquetadoService.updateEtiquetado(regulationId, updateData)
    
    if (response.success) {
      // Redirect to regulations index
      router.push(`/basedatos/regulaciones`)
    } else {
      alert('Error al actualizar la regulación: ' + response.error)
    }
  } catch (err) {
    console.error('Error updating regulation:', err)
    alert('Error al actualizar la regulación')
  } finally {
    isSubmitting.value = false
  }
}

// Load regulation on mount
onMounted(async () => {
  if (isNaN(regulationId)) {
    error.value = 'ID de regulación inválido'
    loading.value = false
    return
  }
  
  // First load products, then load regulation
  await searchProducts('')
  await loadRegulation()
})
</script> 