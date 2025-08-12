<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <UButton label="Volver" icon="i-heroicons-arrow-left" variant="outline" @click="goBack" class="mr-4" />
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              Nueva Regulación Antidumping
            </h1>
          
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

        <!-- Price and Antidumping -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              P. declarado
              <span class="text-red-500 ml-1">*</span>
            </label>
            <UInput 
              v-model="formData.precioDeclarado" 
              type="number" 
              step="0.01" 
              placeholder="Ej: 7.5"
              icon="i-heroicons-currency-dollar" 
              class="w-full" 
              :color="validationErrors.precioDeclarado ? 'error' : undefined"
              @update:model-value="clearFieldError('precioDeclarado')"
            />
            <p v-if="validationErrors.precioDeclarado" class="mt-1 text-sm text-red-600 dark:text-red-400">
              {{ validationErrors.precioDeclarado }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Antidumping
              <span class="text-red-500 ml-1">*</span>
            </label>
            <UInput 
              v-model="formData.antidumping" 
              type="number" 
              step="0.01" 
              placeholder="Ej: 0.63"
              icon="i-heroicons-currency-dollar" 
              class="w-full" 
              :color="validationErrors.antidumping ? 'error' : undefined"
              @update:model-value="clearFieldError('antidumping')"
            />
            <p v-if="validationErrors.antidumping" class="mt-1 text-sm text-red-600 dark:text-red-400">
              {{ validationErrors.antidumping }}
            </p>
          </div>
        </div>

        <!-- Images Upload -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Imágenes del producto
            </label>
            <UButton label="Agregar imagen" icon="i-heroicons-plus" size="xs" @click="addImageSlot" />
          </div>
          <div class="flex gap-3 overflow-x-auto pb-2">
            <div v-for="(slot, index) in imageSlots" :key="index"
              class="flex-shrink-0 w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              @click="selectImage(index)">
              <div v-if="!slot.file" class="text-center">
                <UIcon name="i-heroicons-photo" class="w-8 h-8 text-gray-400 mx-auto mb-1" />
                <span class="text-xs text-gray-500">Agregar imagen</span>
              </div>
              <img v-else :src="slot.preview || ''" :alt="`Imagen ${index + 1}`"
                class="w-full h-full object-cover rounded-lg" />
            </div>
          </div>
        </div>

        <!-- Observations -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Comentarios
          </label>
          <UTextarea v-model="formData.observaciones" placeholder="Agregar observaciones sobre el antidumping..."
            :rows="3" class="w-full" />
        </div>
      </div>
    </UCard>

    <!-- Modal para crear producto -->

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import ProductService from '~/services/productService'
import ProductRubroService from '~/services/productRubroService'
import AntidumpingService, { type CreateAntidumpingRequest } from '~/services/antidumpingService'
import type { ProductRubro } from '~/types/product-rubro'
import { useNotifications } from '~/composables/useNotifications'
import { useLoading } from '~/composables/useLoading'
// Router
const router = useRouter()

// Service instances
const productService = ProductService.getInstance()
const productRubroService = ProductRubroService.getInstance()
const antidumpingService = AntidumpingService.getInstance()

// Notifications and loading
const { showCreateSuccess, showServerError, showValidationError } = useNotifications()
const { withLoading } = useLoading()
// Form data
const formData = ref({
  producto: null as any,
  descripcion: '',
  partida: '',
  precioDeclarado: '',
  antidumping: '',
  observaciones: ''
})

// Validation errors
const validationErrors = ref({
  producto: '',
  descripcion: '',
  partida: '',
  precioDeclarado: '',
  antidumping: ''
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

// Image slots
interface ImageSlot {
  file: File | null
  preview: string | null
}

const imageSlots = ref<ImageSlot[]>([
  { file: null, preview: null }
])

// Validation methods
const validateField = (field: string, value: any): string => {
  switch (field) {
    case 'producto':
      return !value || !value.value ? 'Producto es requerido' : ''
    case 'descripcion':
      return !value || (typeof value === 'string' && value.trim() === '') ? 'Descripción es requerida' : ''
    case 'partida':
      return !value || (typeof value === 'string' && value.trim() === '') ? 'Partida es requerida' : ''
    case 'precioDeclarado':
      if (!value || (typeof value === 'string' && value.trim() === '')) return 'Precio declarado es requerido'
      const precioNum = parseFloat(value)
      if (isNaN(precioNum)) return 'Precio debe ser un número válido'
      if (precioNum <= 0) return 'Precio debe ser mayor a 0'
      return ''
    case 'antidumping':
      console.log('value', value)
      if ( (typeof value === 'string' && value.trim() === '')) return 'Antidumping es requerido'
      const antidumpingNum = parseFloat(value)
      if (isNaN(antidumpingNum)) return 'Antidumping debe ser un número válido'
      if (antidumpingNum < 0) return 'Antidumping debe ser mayor o igual a 0'
      return ''
    default:
      return ''
  }
}

const validateForm = (): boolean => {
  const errors = {
    producto: validateField('producto', formData.value.producto),
    descripcion: validateField('descripcion', formData.value.descripcion),
    partida: validateField('partida', formData.value.partida),
    precioDeclarado: validateField('precioDeclarado', formData.value.precioDeclarado),
    antidumping: validateField('antidumping', formData.value.antidumping)
  }
  
  validationErrors.value = errors
  
  return !Object.values(errors).some(error => error !== '')
}

const clearFieldError = (field: string) => {
  validationErrors.value[field as keyof typeof validationErrors.value] = ''
}

// Methods
const goBack = () => {
  // Redirigir a la página de regulaciones con el tab de antidumping seleccionado
  router.push('/basedatos/regulaciones?tab=antidumping')
}

const addImageSlot = () => {
  imageSlots.value.push({ file: null, preview: null })
}

const selectImage = (index: number) => {
  // Crear un input file oculto
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'

  input.onchange = (event) => {
    const target = event.target as HTMLInputElement
    if (target.files && target.files[0]) {
      const file = target.files[0]
      const reader = new FileReader()

      reader.onload = (e) => {
        imageSlots.value[index] = {
          file: file,
          preview: e.target?.result as string
        }
      }

      reader.readAsDataURL(file)
    }
  }

  input.click()
}

const searchProducts = async (searchTerm: string) => {
  console.log('searchTerm', searchTerm)
  try {
    loadingProducts.value = true
    const response = await productRubroService.getProductRubros(searchTerm,'ANTIDUMPING')

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
      tipo: 'ANTIDUMPING'
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

const saveForm = async () => {
  try {
    // Validar formulario completo
    if (!validateForm()) {
      console.error('Formulario tiene errores de validación')
      showValidationError('Por favor, corrige los errores en el formulario antes de continuar.')
      return
    }
    
    console.log('Guardando regulación antidumping:', formData.value)
    console.log('Imágenes:', imageSlots.value)
    
    console.log('formData.value.antidumping', formData.value.antidumping)
    const payload: CreateAntidumpingRequest = {
      producto_id: parseInt(formData.value.producto.value),
      descripcion: formData.value.descripcion,
      partida: formData.value.partida,
      precio_declarado: parseFloat(formData.value.precioDeclarado),
      antidumping: formData.value.antidumping ? parseFloat(formData.value.antidumping) : 0,
      observaciones: formData.value.observaciones || undefined,
      imagenes: imageSlots.value
        .filter(slot => slot.file)
        .map(slot => slot.file!)
    }
    
    console.log('Payload para API:', payload)
    
    // Llamar al servicio para crear la regulación con loading
    const response = await withLoading(
      () => antidumpingService.createAntidumping(payload),
      'saveAntidumping',
      'Guardando regulación antidumping...'
    )
    
    if (response.success) {
      showCreateSuccess('Regulación Antidumping')
      
      setTimeout(() => {
        router.push('/basedatos/regulaciones?tab=antidumping')
      }, 1500)
    } else {
      showServerError('crear la regulación antidumping', response.error)
    }
    
  } catch (error: any) {
    console.error('Error al guardar:', error)
    if (error.name === 'ValidationError') {
      showValidationError(error.message)
    } else {
      showServerError('crear la regulación antidumping', error.message)
    }
  }
}

// Watchers para validación en tiempo real
watch(() => formData.value.producto, (newValue) => {
  if (newValue) {
    clearFieldError('producto')
  }
})

watch(() => formData.value.descripcion, (newValue) => {
  if (newValue && typeof newValue === 'string' && newValue.trim() !== '') {
    clearFieldError('descripcion')
  }
})

watch(() => formData.value.partida, (newValue) => {
  if (newValue && typeof newValue === 'string' && newValue.trim() !== '') {
    clearFieldError('partida')
  }
})

watch(() => formData.value.precioDeclarado, (newValue) => {
  if (newValue && !isNaN(parseFloat(newValue)) && parseFloat(newValue) > 0) {
    clearFieldError('precioDeclarado')
  }
})

watch(() => formData.value.antidumping, (newValue) => {
  if (newValue && !isNaN(parseFloat(newValue)) && parseFloat(newValue) >= 0) {
    clearFieldError('antidumping')
  }
})

// Cargar productos iniciales
onMounted(() => {
  searchProducts('')
})
</script>