<template>
  <div class="p-6">
    <div class="flex justify-end">
      <UButton label="Ver Excel de productos" icon="i-heroicons-eye" color="neutral" variant="outline"
        @click="goToArchivos" />
    </div>
    <DataTable title="Productos" icon="i-heroicons-document-text" :data="filteredProducts" :columns="columns"
      :loading="loading" :current-page="currentPage" :total-pages="totalPages" :total-records="totalRecords"
      :items-per-page="itemsPerPage" :show-secondary-search="true" secondary-search-label="Buscar por"
      secondary-search-placeholder="Filtro específico..." :show-filters="true" :filter-config="filterConfig"
      empty-state-message="No se encontraron productos que coincidan con los criterios de búsqueda."
      :search-query-value="searchQuery" :secondary-search-value="secondarySearch" :filters-value="filters"
      :show-headers="true" :headers="headers" @update:search-query="searchQuery = $event"
      @update:primary-search="handleSearch" @filter-change="handleFilterChange" @update:current-page="onPageChange"
      @update:items-per-page="onItemsPerPageChange" />

    <ImageModal v-if="showImageModal" :is-open="showImageModal" :image-url="selectedImage" :title="selectedImageTitle"
      @close="closeImageModal" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, h, resolveComponent } from 'vue'
import type { ProductMapped } from '~/types/product'
import type { TableColumn } from '@nuxt/ui'
import ImageModal from '~/components/ImageModal.vue'
import { formatCurrency } from '~/utils/formatters'
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