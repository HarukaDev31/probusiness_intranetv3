<template>
  <div class="p-6">
    <!-- Header -->
    <PageHeader 
      title="Editar Regulación de Etiquetado"
      subtitle="Modifica la información del etiquetado"
      icon="i-heroicons-pencil-square"
      :loading="isSubmitting"
      @back="goBackToEtiquetado"
      
    />
    <div class="flex justify-end">
        <UButton 
            label="Guardar" 
            icon="i-heroicons-document-arrow-down"
            color="primary"
            :loading="isSubmitting"
            :disabled="isSubmitting"
            @click="enhancedSaveForm"
        />
    </div>
    <!-- Loading State -->
    <LoadingState v-if="loading" message="Cargando regulación..." />
    <!-- Error State -->
    <ErrorState 
      v-else-if="error" 
      :message="error"
      @retry="enhancedLoadRegulation"
    />

    <!-- Form -->
    <UCard v-else>
      <div class="space-y-6">
        <!-- Product Selector -->
        <ProductSelector 
          v-model="formData.producto"
          :options="productOptions"
          :loading="loadingProducts"
          :error="validationErrors.producto"
          @search="searchProducts"
          @clear-error="clearFieldError('producto')"
          @create-product="createProduct"
        />

        <!-- Existing Images -->
        <ExistingImagesSection 
          v-if="existingImages.length > 0"
          :images="existingImages"
          :selected-images="imagesToDelete"
          :selected-count="imagesToDelete.length"
          @toggle-selection="toggleImageDelete"
          @delete-selected="deleteSelectedImages"
          @deselect-all="deselectAllImages"
        />

        <!-- New Images Upload -->
        <NewImagesSection 
          :image-slots="imageSlots"
          @add-slot="addImageSlot"
          @select-image="selectImage"
          @remove-slot="removeImageSlot"
        />

        <!-- Observations -->
        <ObservationsField 
          v-model="formData.observaciones"
        />
      </div>
    </UCard>

    <!-- Create Product Modal -->
    <CreateProductModal 
      v-model="showCreateProductModal"
      v-model:product="newProduct"
      @create="createProduct"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEtiquetadoEdit } from '~/composables/useEtiquetadoEdit'
import { useProductSelector } from '~/composables/useProductSelector'
import { useImageManagement } from '~/composables/useImageManagement'
import { useFormValidation } from '~/composables/useFormValidation'
import { useNavigation } from '~/composables/useNavigation'

// Router and Route
const router = useRouter()
const route = useRoute()

// Composables
const { 
  formData, 
  validationErrors, 
  loading, 
  isSubmitting, 
  error,
  loadRegulation, 
  saveForm,
  setExistingImagesCallbackFn
} = useEtiquetadoEdit(route.params.id as string)

const { 
  productOptions, 
  loadingProducts, 
  searchProducts, 
  createProduct: createProductService 
} = useProductSelector()

const { 
  existingImages, 
  imagesToDelete, 
  imagesToDeleteBackend,
  imageSlots,
  toggleImageDelete, 
  deleteSelectedImages, 
  deselectAllImages,
  addImageSlot, 
  selectImage, 
  removeImageSlot,
  setExistingImages
} = useImageManagement()

const { validateForm, clearFieldError } = useFormValidation(formData, validationErrors)

const { goBack } = useNavigation()

// Override goBack to redirect to etiquetado tab
const goBackToEtiquetado = () => {
  goBack('/basedatos/regulaciones?tab=etiquetado')
}

// Enhanced loadRegulation to set existing images
const enhancedLoadRegulation = async () => {
  // Set up callback for existing images
  setExistingImagesCallbackFn(setExistingImages)
  await loadRegulation()
}

// Enhanced saveForm to pass image data
const enhancedSaveForm = async () => {
  if (!validateForm()) {
    return
  }
  await saveForm(imagesToDeleteBackend.value, imageSlots.value)
}

// Modal state
const showCreateProductModal = ref(false)
const newProduct = ref({ nombre: '' })

// Enhanced createProduct to handle modal
const createProduct = async () => {
  const createdProduct = await createProductService(newProduct.value.nombre)
  if (createdProduct) {
    formData.value.producto = createdProduct
    newProduct.value = { nombre: '' }
    showCreateProductModal.value = false
  }
}

// Load regulation and products on mount
onMounted(async () => {
  await enhancedLoadRegulation()
})
</script> 