<template>
    <div class="p-6 max-w-4xl mx-auto">
        <!-- Top Navigation Bar -->
        <div class="flex items-center justify-between mb-6">
            <UButton label="Regresar" icon="i-heroicons-arrow-left" variant="outline" @click="goBack" />
            <div class="flex items-center gap-2">
                <!-- Botón de Editar (solo visible para rol Documentacion) -->
                <UButton 
                    v-if="hasRole('Documentacion') && !isEditing" 
                    label="Editar" 
                    icon="i-heroicons-pencil-square" 
                    color="primary" 
                    @click="startEditing" 
                />
                <!-- Botón de Guardar (solo visible cuando está editando) -->
                <UButton 
                    v-if="isEditing" 
                    label="Guardar" 
                    icon="i-heroicons-document-arrow-down" 
                    color="success" 
                    @click="saveForm" 
                />
                <!-- Botón de Cancelar (solo visible cuando está editando) -->
                <UButton 
                    v-if="isEditing" 
                    label="Cancelar" 
                    icon="i-heroicons-x-mark" 
                    variant="outline" 
                    @click="cancelEditing" 
                />
            </div>
        </div>

        <!-- Loading Skeleton -->
        <div v-if="loading" class="space-y-6">
            <UCard>
                <template #header>
                    <div class="animate-pulse">
                        <div class="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div class="h-10 bg-gray-200 rounded w-full"></div>
                    </div>
                </template>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Tributos aduanero skeleton -->
                    <div class="space-y-4">
                        <div class="h-6 bg-gray-200 rounded w-1/3"></div>
                        <div class="space-y-3">
                            <div v-for="i in 4" :key="i" class="flex items-center gap-4">
                                <div class="h-4 bg-gray-200 rounded w-24"></div>
                                <div class="h-10 bg-gray-200 rounded flex-1"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Requisito aduanero skeleton -->
                    <div class="space-y-4">
                        <div class="h-6 bg-gray-200 rounded w-1/3"></div>
                        <div class="space-y-3">
                            <div v-for="i in 3" :key="i" class="flex items-center gap-4">
                                <div class="h-4 bg-gray-200 rounded w-24"></div>
                                <div class="h-10 bg-gray-200 rounded flex-1"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Observaciones skeleton -->
                <div class="mt-6 space-y-4">
                    <div class="flex items-center gap-4">
                        <div class="h-4 bg-gray-200 rounded w-32"></div>
                        <div class="h-6 w-11 bg-gray-200 rounded-full"></div>
                    </div>
                    <div class="h-24 bg-gray-200 rounded w-full"></div>
                </div>
            </UCard>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-8">
            <UIcon name="i-heroicons-exclamation-triangle" class="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Error al cargar el producto</h3>
            <p class="text-gray-600 mb-4">{{ error }}</p>
            <UButton label="Intentar de nuevo" @click="loadProduct" />
        </div>

        <!-- Form Content -->
        <UCard v-else>


            <!-- Product Link Section -->
            <div class="mb-6">
                <div class="flex items-center gap-4">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-24">
                        Link producto:
                    </label>
                    <UInput v-model="formData.productLink" placeholder="www.alibaba.com/..." class="flex-1" :disabled="!isEditing" />
                    <UButton 
                        v-if="formData.productLink" 
                        icon="i-heroicons-arrow-top-right-on-square" 
                        variant="outline" 
                        size="sm"
                        @click="openProductLink"
                        :disabled="!isValidUrl(formData.productLink)"
                        :title="isValidUrl(formData.productLink) ? 'Abrir link en nueva pestaña' : 'URL inválida'"
                    >
                        Abrir
                    </UButton>
                </div>
            </div>

            <!-- Main Form Sections -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                <!-- Tributos aduanero -->
                <div class="space-y-4">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        Tributos aduanero
                    </h3>

                    <div class="space-y-3">
                        <div class="flex items-center gap-4">
                            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-32">
                                Arancel Sunat:
                            </label>
                            <UInput v-model="formData.arancelSunat" placeholder="0%" class="flex-1" :disabled="!isEditing" />
                        </div>

                        <div class="flex items-center gap-4">
                            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-32">
                                Arancel TLC:
                            </label>
                            <UInput v-model="formData.arancelTlc" placeholder="0%" class="flex-1" :disabled="!isEditing" />
                        </div>

                        <div class="flex items-center gap-4">
                            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-32">
                                Correlativo:
                            </label>
                            <UInput v-model="formData.correlativo" placeholder="NO" class="flex-1" :disabled="!isEditing" />
                        </div>

                        <div class="flex items-center gap-4">
                            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-32">
                                Antidumping:
                            </label>
                            <USelect v-model="formData.antidumping" :items="antidumpingOptions"
                                placeholder="Seleccionar" class="flex-1" :disabled="!isEditing" />
                        </div>

                        <!-- Campo adicional para valor de antidumping -->
                        <div v-if="formData.antidumping === 'SI'" class="flex items-center gap-4">
                            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-32">
                                Valor Antidumping:
                            </label>
                            <UInput v-model="formData.antidumpingValue" placeholder="Ingrese el valor de antidumping"
                                class="flex-1" :disabled="!isEditing" />
                        </div>
                    </div>
                </div>

                <!-- Requisito aduanero -->
                <div class="space-y-4">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        Requisito aduanero
                    </h3>

                    <div class="space-y-3">
                        <div class="flex items-center gap-4">
                            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-32">
                                Tipo de producto:
                            </label>
                            <USelect v-model="formData.tipoProducto" :items="tipoProductoOptions"
                                placeholder="Seleccionar" class="flex-1" :disabled="!isEditing" />
                        </div>

                                                 <!-- Campo adicional para entidad cuando es RESTRINGIDO -->
                         <div v-if="formData.tipoProducto === 'RESTRINGIDO'" class="flex items-center gap-4">
                             <label class="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-32">
                                 Entidad:
                             </label>
                             <UInputMenu  
                                 v-model="formData.entidad" 
                                 :items="entidadesOptions.map(e => e.nombre)"
                                 placeholder="Buscar entidad..." 
                                 class="flex-1" 
                                 :loading="loadingEntidades"
                                 :disabled="!isEditing"
                                 @update:searchTerm="searchEntidades"
                                 @update:model-value="onEntidadSelected" />
                         </div>

                        <div class="flex items-center gap-4">
                            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-32">
                                Etiquetado:
                            </label>
                            <USelect v-model="formData.etiquetado" :items="etiquetadoOptions" placeholder="Seleccionar"
                                class="flex-1" :disabled="!isEditing" />
                        </div>

                                                 <!-- Campo adicional para etiquetado especial -->
                         <div v-if="formData.etiquetado === 'ESPECIAL'" class="flex items-center gap-4">
                             <label class="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-32">
                                 Tipo Etiquetado:
                             </label>
                             <UInputMenu  
                                 v-model="formData.tipoEtiquetado" 
                                 :items="etiquetadosOptions.map(e => e.nombre)"
                                 placeholder="Buscar tipo de etiquetado..." 
                                 class="flex-1" 
                                 :loading="loadingEtiquetados"
                                 :disabled="!isEditing"
                                 @update:searchTerm="searchEtiquetados"
                                 @update:model-value="onEtiquetadoSelected" />
                         </div>

                        <div class="flex items-center gap-4">
                            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-32">
                                Documento especial:
                            </label>
                            <USelect v-model="formData.documentoEspecial" :items="documentoEspecialOptions"
                                placeholder="Seleccionar" class="flex-1" :disabled="!isEditing" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Observaciones de aduana -->
            <div class="space-y-4">
                <div class="flex items-center gap-4">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Observaciones de aduana:
                    </label>
                    <USwitch v-model="formData.tieneObservaciones" unchecked-icon="i-lucide-x"
                        checked-icon="i-lucide-check" default-value :disabled="!isEditing" />
                </div>

                <UTextarea v-model="formData.observaciones" v-if="formData.tieneObservaciones"
                    placeholder="El vista de aduanas observo la medida del producto." :rows="4" class="w-full" :disabled="!isEditing" />
            </div>
        </UCard>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ProductService from '~/services/productService'
import EntityService from '~/services/entityService'
import ProductRubroService from '~/services/productRubroService'

// Route
const route = useRoute()
const router = useRouter()

// User role composable
const { hasRole } = useUserRole()

// Notifications and loading
const { showUpdateSuccess, showServerError, showValidationError } = useNotifications()
const { withLoading } = useLoading()

// State
const loading = ref(true)
const error = ref<string | null>(null)
const isEditing = ref(false)

// Loading states for autocomplete
const loadingEntidades = ref(false)
const loadingEtiquetados = ref(false)

// Form data
const formData = ref({
    productLink: '',
    arancelSunat: '',
    arancelTlc: '',
    correlativo: '',
    antidumping: '',
    antidumpingValue: '',
    tipoProducto: '',
    entidad: '',
    etiquetado: '',
    tipoEtiquetado: '',
    documentoEspecial: '',
    tieneObservaciones: false,
    observaciones: ''
})

// Options for selects
const antidumpingOptions = ['SI', 'NO']
const tipoProductoOptions = ['LIBRE', 'RESTRINGIDO']
const etiquetadoOptions = ['NORMAL', 'ESPECIAL']
const documentoEspecialOptions = ['SI', 'NO']

// Autocomplete options
const entidadesOptions = ref<{ id: number; nombre: string }[]>([])
const etiquetadosOptions = ref<{ id: number; nombre: string }[]>([])

// Selected IDs for backend
const selectedEntidadId = ref<number | null>(null)
const selectedEtiquetadoId = ref<number | null>(null)

// Methods
const goBack = () => {
    router.back()
}

const loadProduct = async () => {
    const productId = route.params.id

    if (productId) {
        try {
            loading.value = true
            error.value = null

            console.log('Cargando datos del producto:', productId)

            const productService = ProductService.getInstance()
            const response = await productService.getProductById(Number(productId))
            console.log('Response:', response)
            if (response.success && response.data) {
                // Mapear los datos del producto al formulario
                const product = response.data

                // Cargar datos iniciales del formulario
                formData.value = {
                    productLink: product.link || '',
                    arancelSunat: product.arancel_sunat || '',
                    arancelTlc: product.arancel_tlc || '',
                    correlativo: product.correlativo || '',
                    antidumping: product.antidumping || 'NO',
                    antidumpingValue: product.antidumping_value || '',
                    tipoProducto: product.tipo_producto || 'LIBRE',
                    entidad: '', // Se cargará después
                    etiquetado: product.etiquetado || 'NORMAL',
                    tipoEtiquetado: '', // Se cargará después
                    documentoEspecial: product.doc_especial || 'NO',
                    tieneObservaciones: product.tiene_observaciones || false, // Valor por defecto
                    observaciones:product.observaciones || ''
                }

                // Establecer los IDs seleccionados
                selectedEntidadId.value = product.entidad_id ? Number(product.entidad_id) : null
                selectedEtiquetadoId.value = product.tipo_etiquetado_id ? Number(product.tipo_etiquetado_id) : null

                console.log('Datos del producto cargados:', formData.value)
            } else {
                error.value = response.error || 'Error al cargar el producto'
                console.error('Error en la respuesta:', response.error)
            }

        } catch (err) {
            error.value = 'Error al cargar el producto'
            console.error('Error al cargar producto:', err)
        } finally {
            loading.value = false
        }
    } else {
        loading.value = false
        error.value = 'ID de producto no válido'
    }
}



// Search functions for autocomplete
const searchEntidades = async (search: string) => {
  try {
    loadingEntidades.value = true
    const entityService = EntityService.getInstance()
    const response = await entityService.getEntities(search)
    console.log('response:', response)  
    if (response.success) {
      entidadesOptions.value = response.data.map(entity => ({
        id: entity.id,
        nombre: entity.nombre
      }))
      console.log('entidadesOptions:', entidadesOptions.value)
      
      // Marcar como seleccionada la entidad que corresponde al ID guardado
      if (selectedEntidadId.value) {
        const selectedEntidad = entidadesOptions.value.find(e => e.id === selectedEntidadId.value)
        if (selectedEntidad) {
          formData.value.entidad = selectedEntidad.nombre
          console.log('Entidad seleccionada automáticamente:', selectedEntidad.nombre)
        }
      }
    }
  } catch (error) {
    console.error('Error searching entidades:', error)
  } finally {
    loadingEntidades.value = false
  }
}

const searchEtiquetados = async (search: string) => {
  try {
    loadingEtiquetados.value = true
    const productRubroService = ProductRubroService.getInstance()
    const response = await productRubroService.getProductRubros(search)
    
    if (response.success) {
      etiquetadosOptions.value = response.data.map(rubro => ({
        id: rubro.id,
        nombre: rubro.nombre
      }))
      
      // Marcar como seleccionado el etiquetado que corresponde al ID guardado
      if (selectedEtiquetadoId.value) {
        const selectedEtiquetado = etiquetadosOptions.value.find(e => e.id === selectedEtiquetadoId.value)
        if (selectedEtiquetado) {
          formData.value.tipoEtiquetado = selectedEtiquetado.nombre
          console.log('Etiquetado seleccionado automáticamente:', selectedEtiquetado.nombre)
        }
      }
    }
  } catch (error) {
    console.error('Error searching etiquetados:', error)
  } finally {
    loadingEtiquetados.value = false
  }
}

// Selection handlers
const onEntidadSelected = (selectedName: string) => {
  const selectedEntidad = entidadesOptions.value.find(e => e.nombre === selectedName)
  selectedEntidadId.value = selectedEntidad?.id || null
  console.log('Entidad seleccionada:', selectedEntidad)
}

const onEtiquetadoSelected = (selectedName: string) => {
  const selectedEtiquetado = etiquetadosOptions.value.find(e => e.nombre === selectedName)
  selectedEtiquetadoId.value = selectedEtiquetado?.id || null
  console.log('Etiquetado seleccionado:', selectedEtiquetado)
}

// Funciones de edición
const startEditing = () => {
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
  // Recargar los datos originales del producto
  loadProduct()
}

const saveForm = async () => {
  try {
    const productId = route.params.id
    if (!productId) {
      console.error('No hay ID de producto')
      return
    }

    console.log('Guardando formulario:', formData.value)
    
    const productService = ProductService.getInstance()
    
    // Preparar datos para el request
    const updateData = {
      link: formData.value.productLink,
      arancel_sunat: formData.value.arancelSunat,
      arancel_tlc: formData.value.arancelTlc,
      correlativo: formData.value.correlativo,
      antidumping: formData.value.antidumping,
      antidumping_value: formData.value.antidumpingValue,
      tipo_producto: formData.value.tipoProducto,
      entidad_id: selectedEntidadId.value || undefined, // Convertir null a undefined
      etiquetado: formData.value.etiquetado,
      tipo_etiquetado_id: selectedEtiquetadoId.value || undefined, // Convertir null a undefined
      doc_especial: formData.value.documentoEspecial,
      tiene_observaciones: formData.value.tieneObservaciones,
      observaciones: formData.value.observaciones
    }

    console.log('Datos a enviar al backend:', updateData)
    
    const response = await withLoading(
      () => productService.updateProduct(Number(productId), updateData),
      'saveProduct',
      'Guardando cambios...'
    )
    
    if (response.success) {
      console.log('Producto actualizado exitosamente:', response.data)
      isEditing.value = false // Desactivar modo de edición
      showUpdateSuccess('Producto')
    } else {
      console.error('Error al actualizar producto:', response.error)
      showServerError('actualizar el producto', response.error)
    }
    
  } catch (error: any) {
    console.error('Error al guardar:', error)
    if (error.name === 'ValidationError') {
      showValidationError(error.message)
    } else {
      showServerError('actualizar el producto', error.message)
    }
  }
}

// Función para validar URL
const isValidUrl = (url: string): boolean => {
  if (!url) return false
  try {
    // Agregar protocolo si no lo tiene
    const urlToTest = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
    new URL(urlToTest)
    return true
  } catch {
    return false
  }
}

// Función para abrir el link del producto
const openProductLink = () => {
  if (!formData.value.productLink) return
  
  try {
    // Agregar protocolo si no lo tiene
    const url = formData.value.productLink.startsWith('http://') || formData.value.productLink.startsWith('https://') 
      ? formData.value.productLink 
      : `https://${formData.value.productLink}`
    
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch (error) {
    console.error('Error al abrir el link:', error)
  }
}

// Load product data on mount
onMounted(() => {
    // Los datos del usuario se cargan globalmente en el plugin
    loadProduct()
    const entityService = EntityService.getInstance()
    const productRubroService = ProductRubroService.getInstance()
    productRubroService.getProductRubros('')
    searchEntidades('')
    searchEtiquetados('')
})
</script>

<style scoped></style>
