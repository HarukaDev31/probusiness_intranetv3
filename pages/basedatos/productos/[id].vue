<template>
    <div class="p-6 max-w-4xl mx-auto">
        <!-- Top Navigation Bar -->
        <div class="flex items-center justify-between mb-6">
            <UButton label="Regresar" icon="i-heroicons-arrow-left" variant="outline" @click="goBack" />
            <UButton label="Guardar" icon="i-heroicons-document-arrow-down" color="warning" @click="saveForm" />
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
                    <UInput v-model="formData.productLink" placeholder="www.alibaba.com/..." class="flex-1" />
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
                            <UInput v-model="formData.arancelSunat" placeholder="0%" class="flex-1" />
                        </div>

                        <div class="flex items-center gap-4">
                            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-32">
                                Arancel TLC:
                            </label>
                            <UInput v-model="formData.arancelTlc" placeholder="0%" class="flex-1" />
                        </div>

                        <div class="flex items-center gap-4">
                            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-32">
                                Correlativo:
                            </label>
                            <UInput v-model="formData.correlativo" placeholder="NO" class="flex-1" />
                        </div>

                        <div class="flex items-center gap-4">
                            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-32">
                                Antidumping:
                            </label>
                            <USelect v-model="formData.antidumping" :items="antidumpingOptions"
                                placeholder="Seleccionar" class="flex-1" />
                        </div>

                        <!-- Campo adicional para valor de antidumping -->
                        <div v-if="formData.antidumping === 'SI'" class="flex items-center gap-4">
                            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-32">
                                Valor Antidumping:
                            </label>
                            <UInput v-model="formData.antidumpingValue" placeholder="Ingrese el valor de antidumping"
                                class="flex-1" />
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
                                placeholder="Seleccionar" class="flex-1" />
                        </div>

                        <!-- Campo adicional para entidad cuando es RESTRINGIDO -->
                        <div v-if="formData.tipoProducto === 'RESTRINGIDO'" class="flex items-center gap-4">
                            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-32">
                                Entidad:
                            </label>
                            <UInputMenu  v-model="formData.entidad" :items="entidadesOptions"
                                placeholder="Buscar entidad..." class="flex-1" :loading="loadingEntidades"
                                @update:search="searchEntidades" />
                        </div>

                        <div class="flex items-center gap-4">
                            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-32">
                                Etiquetado:
                            </label>
                            <USelect v-model="formData.etiquetado" :items="etiquetadoOptions" placeholder="Seleccionar"
                                class="flex-1" />
                        </div>

                        <!-- Campo adicional para etiquetado especial -->
                        <div v-if="formData.etiquetado === 'ESPECIAL'" class="flex items-center gap-4">
                            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-32">
                                Tipo Etiquetado:
                            </label>
                            <UInputMenu  v-model="formData.tipoEtiquetado" :items="etiquetadosOptions"
                                placeholder="Buscar tipo de etiquetado..." class="flex-1" :loading="loadingEtiquetados"
                                @update:search="searchEtiquetados" />
                        </div>

                        <div class="flex items-center gap-4">
                            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-32">
                                Documento especial:
                            </label>
                            <USelect v-model="formData.documentoEspecial" :items="documentoEspecialOptions"
                                placeholder="Seleccionar" class="flex-1" />
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
                        checked-icon="i-lucide-check" default-value />
                </div>

                <UTextarea v-model="formData.observaciones"
                    placeholder="El vista de aduanas observo la medida del producto." :rows="4" class="w-full" />
            </div>
        </UCard>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ProductService from '~/services/productService'
import RegulationService from '~/services/regulationService'

// Route
const route = useRoute()
const router = useRouter()

// State
const loading = ref(true)
const error = ref<string | null>(null)

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
const regulationService = RegulationService.getInstance()

// Autocomplete options
const entidadesOptions = ref<string[]>([])
const etiquetadosOptions = ref<string[]>([])

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

                formData.value = {
                    productLink: product.link || '',
                    arancelSunat: product.arancel_sunat || '',
                    arancelTlc: product.arancel_tlc || '',
                    correlativo: product.correlativo || '',
                    antidumping: product.antidumping || 'NO',
                    antidumpingValue: '', // Valor por defecto
                    tipoProducto: product.tipo_producto || 'LIBRE',
                    entidad: '', // Valor por defecto
                    etiquetado: product.etiquetado || 'NORMAL',
                    tipoEtiquetado: '', // Valor por defecto
                    documentoEspecial: product.doc_especial || 'NO',
                    tieneObservaciones: false, // No existe en la interfaz, usar valor por defecto
                    observaciones: '' // No existe en la interfaz, usar valor por defecto
                }

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
  if (search.length < 2) return
  
  try {
    loadingEntidades.value = true
    const response = await regulationService.getEntidades(search)
    
    if (response.success) {
      entidadesOptions.value = response.data
    }
  } catch (error) {
    console.error('Error searching entidades:', error)
  } finally {
    loadingEntidades.value = false
  }
}

const searchEtiquetados = async (search: string) => {
  if (search.length < 2) return
  
  try {
    loadingEtiquetados.value = true
    const regulationService = RegulationService.getInstance()
    const response = await regulationService.getEtiquetados(search)
    
    if (response.success) {
      etiquetadosOptions.value = response.data
    }
  } catch (error) {
    console.error('Error searching etiquetados:', error)
  } finally {
    loadingEtiquetados.value = false
  }
}

const saveForm = async () => {
  try {
    // Aquí iría la lógica para guardar el formulario
    console.log('Guardando formulario:', formData.value)
    
    // Simular guardado exitoso
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mostrar notificación de éxito
    console.log('Formulario guardado exitosamente')
    
  } catch (error) {
    console.error('Error al guardar:', error)
  }
}

// Load product data on mount
onMounted(() => {
    loadProduct()
    regulationService.getEntidades('')
    regulationService.getEtiquetados('')
})
</script>

<style scoped></style>
