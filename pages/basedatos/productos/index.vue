<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center">
        <UIcon name="i-heroicons-document-text" class="text-2xl mr-3 text-gray-700 dark:text-gray-300" />
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Productos</h1>
      </div>
    </div>

    <!-- Controls -->
    <UCard class="mb-6">
                   <template #header>
               <div class="flex flex-wrap items-center justify-between gap-4">
                 <!-- Items per page -->
                 <div class="flex items-center gap-2">
                   <label class="text-sm text-gray-600 dark:text-gray-400">Mostrar:</label>
                   <USelect
                     v-model="itemsPerPage"
                     :options="[5, 10, 25, 50, 100]"
                     placeholder="10"
                     class="w-20"
                     @update:model-value="onItemsPerPageChange"
                   />
                   <span class="text-sm text-gray-600 dark:text-gray-400">registros</span>
                 </div>

                 <!-- Search and Actions -->
                 <div class="flex items-center gap-3">
                   <!-- Main Search -->
                   <UInput
                     v-model="searchQuery"
                     placeholder="Buscar por..."
                     class="w-64"
                     icon="i-heroicons-magnifying-glass"
                   />

                   <!-- Export Button -->
                   <UButton
                     label="Exportar"
                     icon="i-heroicons-arrow-up-tray"
                     variant="outline"
                     @click="exportData"
                   />

                   <!-- Filters Button -->
                   <UButton
                     label="Filtros"
                     icon="i-heroicons-funnel"
                     variant="outline"
                     @click="showFilters = !showFilters"
                   />

                   <!-- Secondary Search -->
                   <div class="flex items-center gap-2">
                     <label class="text-sm text-gray-600 dark:text-gray-400">Buscar por:</label>
                     <UInput
                       v-model="secondarySearch"
                       placeholder="Filtro específico..."
                       class="w-48"
                       @input="onSecondarySearch"
                     />
                   </div>
                 </div>
               </div>
             </template>

             <!-- Filters Panel -->
             <div v-if="showFilters" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
               <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div class="field">
                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rubro</label>
                   <USelect
                     v-model="filters.rubro"
                     :options="rubroOptions"
                     placeholder="Seleccionar rubro"
                     class="w-full"
                   />
                 </div>
                 <div class="field">
                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo Producto</label>
                   <USelect
                     v-model="filters.tipoProducto"
                     :options="tipoProductoOptions"
                     placeholder="Seleccionar tipo"
                     class="w-full"
                   />
                 </div>
                 <div class="field">
                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campaña</label>
                   <USelect
                     v-model="filters.campana"
                     :options="campanaOptions"
                     placeholder="Seleccionar campaña"
                     class="w-full"
                   />
                 </div>
               </div>
             </div>
    </UCard>

               <!-- Data Table -->
           <UTable
             :rows="filteredProducts"
             :loading="loading"
             :columns="columns"
             :ui="{ wrapper: 'min-h-full' }"
             @update:rows="(rows: any) => console.log('UTable rows updated:', rows)"
           >
      <template #loading-state>
        <div class="flex items-center justify-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin w-6 h-6 mr-2" />
          <span>Cargando...</span>
        </div>
      </template>

      <template #empty-state>
        <div class="text-center py-8">
          <UIcon name="i-heroicons-inbox" class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-semibold text-gray-900">No hay registros</h3>
          <p class="mt-1 text-sm text-gray-500">No se encontraron productos que coincidan con los criterios de búsqueda.</p>
        </div>
      </template>
    </UTable>

               <!-- Pagination -->
           <div class="mt-6 flex items-center justify-between">
             <div class="text-sm text-gray-700 dark:text-gray-300">
               Mostrando {{ (currentPage - 1) * itemsPerPage + 1 }} a {{ Math.min(currentPage * itemsPerPage, totalRecords) }} de {{ totalRecords }} resultados
             </div>
             <UPagination
               v-model="currentPage"
               :page-count="totalPages"
               :total="totalRecords"
               @update:model-value="onPageChange"
             />
           </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import type { ProductMapped } from '~/types/product'

// Composable para productos
const {
  products,
  loading,
  error,
  totalRecords,
  currentPage,
  itemsPerPage,
  totalPages,
  searchQuery,
  filters,
  filterOptions,
  hasProducts,
  isEmpty,
  loadProducts,
  loadFilterOptions,
  searchProducts,
  applyFilters,
  clearFilters,
  exportProducts,
  deleteProduct: deleteProductFromAPI
} = useProducts()

// State local
const showFilters = ref(false)
const secondarySearch = ref('')

// Configuración de columnas para UTable
const columns = [
  {
    id: 'id',
    key: 'id',
    label: 'N°',
    sortable: true
  },
  {
    id: 'nombreComercial',
    key: 'nombreComercial',
    label: 'Nombre comercial',
    sortable: true
  },
  {
    id: 'foto',
    key: 'foto',
    label: 'Foto'
  },
  {
    id: 'caracteristicas',
    key: 'caracteristicas',
    label: 'Características'
  },
  {
    id: 'rubro',
    key: 'rubro',
    label: 'Rubro',
    sortable: true
  },
  {
    id: 'tipoProducto',
    key: 'tipoProducto',
    label: 'T. Producto',
    sortable: true
  },
  {
    id: 'unidadComercial',
    key: 'unidadComercial',
    label: 'Unidad Com.'
  },
  {
    id: 'precioExw',
    key: 'precioExw',
    label: 'Precio Exw',
    sortable: true
  },
  {
    id: 'subpartida',
    key: 'subpartida',
    label: 'Subpartida'
  },
  {
    id: 'cargaContenedor',
    key: 'cargaContenedor',
    label: 'Campaña',
    sortable: true
  },
  {
    id: 'actions',
    key: 'actions',
    label: 'Acciones'
  }
]

// Computed para opciones de filtros (convertir readonly a mutable)
const rubroOptions = computed(() => [...filterOptions.value.rubros])
const tipoProductoOptions = computed(() => [...filterOptions.value.tiposProducto])
const campanaOptions = computed(() => [...filterOptions.value.campanas])

// Computed para productos filtrados (incluyendo búsqueda secundaria)
const filteredProducts = computed(() => {
  let filtered = products.value
  console.log('Computing filtered products. Total products:', products.value.length)

  // Búsqueda secundaria
  if (secondarySearch.value) {
    filtered = filtered.filter(product => 
      product.caracteristicas.toLowerCase().includes(secondarySearch.value.toLowerCase()) ||
      product.descripcion.toLowerCase().includes(secondarySearch.value.toLowerCase())
    )
  }

  console.log('Filtered products result:', filtered.length)
  return filtered
})

// Watchers
watch(searchQuery, () => {
  searchProducts()
})

watch(filters, () => {
  applyFilters()
}, { deep: true })

// Methods
const onSecondarySearch = () => {
  // La búsqueda secundaria se aplica en el computed
}

const onItemsPerPageChange = (newLimit: number) => {
  loadProducts({ page: 1, limit: newLimit })
}

const onPageChange = (page: number) => {
  loadProducts({ page })
}

const formatPrice = (price: number): string => {
  return price.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const exportData = async () => {
  const success = await exportProducts('excel')
  if (success) {
    // Mostrar notificación de éxito
    console.log('Exportación exitosa')
  }
}

const viewProduct = (product: ProductMapped) => {
  // Navegar a la página de detalles del producto
  navigateTo(`/basedatos/productos/${product.id}`)
}

const editProduct = (product: ProductMapped) => {
  // Navegar a la página de edición del producto
  navigateTo(`/basedatos/productos/${product.id}/edit`)
}

const deleteProduct = async (product: ProductMapped) => {
  // Confirmar eliminación
  if (confirm(`¿Estás seguro de que quieres eliminar el producto "${product.nombreComercial}"?`)) {
    const success = await deleteProductFromAPI(product.id)
    if (success) {
      // Mostrar notificación de éxito
      console.log('Producto eliminado exitosamente')
    }
  }
}

// Lifecycle
onMounted(async () => {
  console.log('Productos page mounted, loading data...')
  await Promise.all([
    loadProducts(),
    loadFilterOptions()
  ])
  console.log('Data loading completed')
})
</script>

<style scoped>
:deep(.p-datatable) {
  border: none;
}

:deep(.p-datatable .p-datatable-header) {
  background: transparent;
  border: none;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  color: #374151;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  border-bottom: 1px solid #f1f5f9;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: #f8fafc;
}

:deep(.p-paginator) {
  background: transparent;
  border-top: 1px solid #e2e8f0;
}

:deep(.p-button.p-button-text) {
  color: #6b7280;
}

:deep(.p-button.p-button-text:hover) {
  background: #f3f4f6;
}
</style>