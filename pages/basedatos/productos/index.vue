<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
    <!-- Título y barra de acciones -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
      <h1 class="text-2xl font-semibold text-gray-800 dark:text-gray-100">
        Historial de productos importados
      </h1>
      <div class="flex gap-2 items-center">
        <UInput
          v-model="searchQuery"
          icon="i-heroicons-magnifying-glass"
          placeholder="Buscar por"
          class="w-56"
        />
        <UButton
          icon="i-heroicons-adjustments-horizontal"
          color="neutral"
          variant="outline"
          label="Filtros"
          @click="showFilters = !showFilters"
        />
        <UButton
          label="Ver Excel de productos"
          icon="i-heroicons-eye"
          color="neutral"
          variant="outline"
          @click="goToArchivos"
        />
      </div>
    </div>

    <!-- Filtros -->
    <div v-if="showFilters" class="mb-4">
      <div class="flex flex-wrap gap-4">
        <USelect
          v-for="filter in filterConfig"
          :key="filter.key"
          v-model="filters[filter.key]"
          :options="filter.options"
          :placeholder="filter.placeholder"
          class="w-48"
          @change="handleFilterChange(filter.key, filters[filter.key])"
        />
      </div>
    </div>

    <!-- Headers -->
    <div class="hidden md:flex rounded-t-xl px-6 py-3 font-semibold text-gray-600 dark:text-gray-300 text-sm justify-around">
      <div class="w-16 text-center">N°</div>
      <div class="w-16">Foto</div>
      <div class="flex-1 max-w-[380px]">Nombre comercial</div>
      <div class="w-32">Rubro</div>
      <div class="w-24">T. Producto</div>
      <div class="w-24">Unidad Com.</div>
      <div class="w-28">Precio Exw</div>
      <div class="w-28">Subpartida</div>
      <div class="w-24">Campaña</div>
      <div class="w-32 text-center">Acciones</div>
    </div>

    <!-- Tabla de productos -->
    <div class="space-y-4">
      <template v-if="filteredProducts.length">
        <div
          v-for="(product, idx) in filteredProducts"
          :key="product.id"
          class="bg-white dark:bg-gray-800 rounded-xl shadow-sm flex items-center px-6 py-4 gap-6"
        >
          <!-- N° -->
          <div class="w-8 text-center text-gray-500 dark:text-gray-400 font-medium">{{ idx + 1 }}</div>
          <!-- Foto -->
          <div>
            <img
              v-if="product.foto"
              :src="product.foto"
              :alt="product.nombreComercial"
              class="w-16 h-16 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
              @click="openImageModal(product.foto, product.nombreComercial)"
            />
            <span v-else class="text-gray-400 dark:text-gray-500">Sin foto</span>
          </div>
          <!-- Nombre comercial -->
          <div class="flex-1 min-w-[180px]">
            <div class="font-semibold text-gray-800 dark:text-gray-100">{{ product.nombreComercial }}</div>
          </div>
          <!-- Rubro -->
          <div class="w-32 text-gray-700 dark:text-gray-300">{{ product.rubro }}</div>
          <!-- Tipo Producto -->
          <div class="w-24 text-gray-700 dark:text-gray-300">{{ product.tipoProducto }}</div>
          <!-- Unidad Comercial -->
          <div class="w-24 text-gray-700 dark:text-gray-300">{{ product.unidadComercial }}</div>
          <!-- Precio Exw -->
          <div class="w-28 text-gray-700 dark:text-gray-300">{{ formatPrice(product.precioExw) }}</div>
          <!-- Subpartida -->
          <div class="w-28 text-gray-700 dark:text-gray-300">{{ product.subpartida }}</div>
          <!-- Campaña -->
          <div class="w-24 text-gray-700 dark:text-gray-300">#{{ product.cargaContenedor }}</div>
          <!-- Acciones -->
          <div class="w-32 flex gap-2 items-center justify-center">
            <UButton
              icon="i-heroicons-eye"
              size="xs"
              color="neutral"
              variant="soft"
              @click="viewProduct(product)"
              aria-label="Ver"
            />
            <UButton
              icon="i-heroicons-trash"
              size="xs"
              color="error"
              variant="soft"
              @click="deleteProduct(product)"
              aria-label="Eliminar"
            />
          </div>
        </div>
      </template>
      <div v-else class="text-center py-12 text-gray-400 dark:text-gray-500">
        No se encontraron productos que coincidan con los criterios de búsqueda.
      </div>
    </div>

    <!-- Paginación -->
    <div class="flex justify-end mt-8">
      <UPagination
        v-model="localCurrentPage"
        :page-count="totalPages"
        :total="totalRecords"
        :page="localCurrentPage"
        :items-per-page="itemsPerPage"
        @update:page="onPageChange"
        @update:items-per-page="onItemsPerPageChange"
      />
    </div>

    <!-- Modal de imagen -->
    <ImageModal
      v-if="showImageModal"
      :is-open="showImageModal"
      :image-url="selectedImage"
      :title="selectedImageTitle"
      @close="closeImageModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, h, resolveComponent } from 'vue'
import type { ProductMapped } from '../types/product'
import type { TableColumn } from '@nuxt/ui'
import ImageModal from '../components/ImageModal.vue'
import { formatCurrency } from '../utils/formatters'
const UButton = resolveComponent('UButton')

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
  handleSearch,
  exportProducts,
  deleteProduct: deleteProductFromAPI,
  headers
} = useProducts()

// State local
const secondarySearch = ref('')

// Paginación local (para manejar el v-model de UPagination)
const localCurrentPage = ref(1)

// Estado para el modal de imagen
const showImageModal = ref(false)
const selectedImage = ref('')
const selectedImageTitle = ref('')

const columns: TableColumn<ProductMapped>[] = [
  {
    accessorKey: 'id',
    header: 'N°',
    cell: ({ row }) => {
      const index = products.value.indexOf(row.original)
      return index + 1
    }
  },
  {
    accessorKey: 'nombreComercial',
    header: 'Nombre comercial',
    cell: ({ row }) => row.getValue('nombreComercial')
  },
  {
    accessorKey: 'foto',
    header: 'Foto',
    cell: ({ row }) => {
      const foto = row.getValue('foto')
      const nombreComercial = row.getValue('nombreComercial')

      if (foto) {
        return h('div', { class: 'flex items-center gap-2' }, [
          h('img', {
            src: foto,
            alt: nombreComercial,
            class: 'w-10 h-10 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity',
            onClick: () => openImageModal(String(foto), String(nombreComercial))
          }),
         
        ])
      }
      return h('span', { class: 'text-gray-400' }, 'Sin foto')
    }
  },
  {
    accessorKey: 'caracteristicas',
    header: 'Características',
    cell: ({ row }) => {
      const caracteristicas = row.getValue('caracteristicas') as string
      return h('div', {
        class: 'w-80 text-wrap',
        title: caracteristicas // oltip con texto completo
      }, caracteristicas)
    }
  },
  {
    accessorKey: 'rubro',
    header: 'Rubro',
    cell: ({ row }) => row.getValue('rubro')
  },
  {
    accessorKey: 'tipoProducto',
    header: 'T. Producto',
    cell: ({ row }) => row.getValue('tipoProducto')
  },
  {
    accessorKey: 'unidadComercial',
    header: 'Unidad Com.',
    cell: ({ row }) => row.getValue('unidadComercial')
  },
  {
    accessorKey: 'precioExw',
    header: 'Precio Exw',
    cell: ({ row }) => {
      const precio = Number(row.getValue('precioExw'))
      return formatCurrency(precio)
    }
  },
  {
    accessorKey: 'subpartida',
    header: 'Subpartida',
    cell: ({ row }) => row.getValue('subpartida')
  },
  {
    accessorKey: 'cargaContenedor',
    header: 'Campaña',
    cell: ({ row }) => `# ${row.getValue('cargaContenedor')}`
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
      const product = row.original
      return h('div', { class: 'flex space-x-2' }, [
        h(UButton, {
          size: 'xs',
          icon: 'i-heroicons-eye',
          onClick: () => viewProduct(product)
        }),

        h(UButton, {
          size: 'xs',
          icon: 'i-heroicons-trash',
          color: 'error',
          onClick: () => deleteProduct(product)
        })
      ])
    }
  }
]

// Configuración de filtros para el componente DataTable
const filterConfig = computed(() => [
  {
    key: 'rubro',
    label: 'Rubro',
    placeholder: 'Seleccionar rubro',
    options: [
      { label: 'Todos', value: 'todos' },
      ...filterOptions.value.rubros.map(rubro => ({ label: rubro, value: rubro }))
    ]
  },
  {
    key: 'tipoProducto',
    label: 'Tipo Producto',
    placeholder: 'Seleccionar tipo',
    options: [
      { label: 'Todos', value: 'todos' },
      ...filterOptions.value.tiposProducto.map(tipo => ({ label: tipo, value: tipo }))
    ]
  },
  {
    key: 'campana',
    label: 'Campaña',
    placeholder: 'Seleccionar campaña',
    options: [
      { label: 'Todos', value: 'todos' },
      ...filterOptions.value.campanas.map(campana => ({ label: campana, value: campana }))
    ]
  }
])

// Computed para productos filtrados (incluyendo búsqueda secundaria)
const filteredProducts = computed(() => {
  let filtered = [...products.value]

  // Búsqueda secundaria
  if (secondarySearch.value) {
    filtered = filtered.filter(product =>
      product.caracteristicas.toLowerCase().includes(secondarySearch.value.toLowerCase()) ||
      product.descripcion.toLowerCase().includes(secondarySearch.value.toLowerCase())
    )
  }

  return filtered
})

// Watchers
watch(searchQuery, () => {
  searchProducts()
})

watch(filters, () => {
  applyFilters()
}, { deep: true })

// Sincronizar página local con la del composable
watch(currentPage, (newPage) => {
  localCurrentPage.value = newPage
})

// Función para manejar cambios en filtros
const handleFilterChange = (filterType: string, value: string) => {
  if (value === 'todos') {
    // Si se selecciona "Todos", eliminar el filtro
    delete (filters.value as any)[filterType]
  } else {
    // Si se selecciona un valor específico, aplicar el filtro
    (filters.value as any)[filterType] = value
  }
  // Aplicar filtros inmediatamente
  applyFilters()
}


const onItemsPerPageChange = (newLimit: number) => {
  loadProducts({ page: 1, limit: newLimit })
}

const onPageChange = (page: number) => {

  localCurrentPage.value = page

  loadProducts({ page })
}

const formatPrice = (price: number): string => {
  return price.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}



const viewProduct = (product: ProductMapped) => {
  // Navegar a la página de detalles del producto
  navigateTo(`/basedatos/productos/${product.id}`)
}

const editProduct = (product: ProductMapped) => {
  // Navegar a la página de edición del producto
  navigateTo(`/basedatos/productos/${product.id}`)
}

const deleteProduct = async (product: ProductMapped) => {
  // Confirmar eliminación
  if (confirm(`¿Estás seguro de que quieres eliminar el producto "${product.nombreComercial}"?`)) {
    const success = await deleteProductFromAPI(product.id)
    if (success) {
      // Mostrar notificación de éxito
    }
  }
}

const openImageModal = (imageUrl: string, title: string) => {
  selectedImage.value = imageUrl
  selectedImageTitle.value = title
  showImageModal.value = true
}

const closeImageModal = () => {
  showImageModal.value = false
  selectedImage.value = ''
  selectedImageTitle.value = ''
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadProducts(),
    loadFilterOptions()
  ])

  // Inicializar página local
  localCurrentPage.value = currentPage.value
})
const goToArchivos = () => {
  navigateTo('/basedatos/productos/archivos')
}
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