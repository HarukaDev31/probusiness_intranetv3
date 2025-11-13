<template>
  <div class="min-h-screen bg-[#eff3f8] dark:bg-gray-900 p-3">
    <!-- Tabla de productos usando DataTable -->
    <div class="space-y-4">
    <DataTable
        :title="'Historial de productos importados'"
        :icon="''"
        :showTitle="true"
  :data="tableRows"
  :columns="tableColumns"
  :loading="loading"
        :showPrimarySearch="true"
        :primarySearchPlaceholder="'Buscar producto'"
  :primarySearchValue="searchQuery"
  @update:primarySearch="onPrimarySearchUpdate"
  :filterConfig="filterConfig"
  :showFilters="true"
  :filtersValue="filters"
  @update:filters="onFiltersUpdate"
  @filter-change="handleFilterChange"
  :currentPage="currentPage"
  :itemsPerPage="itemsPerPage"
  :totalRecords="totalRecords"
  @update:currentPage="onPageChange"
  :prefetchNextPage="prefetchImagesForPage"
  @update:itemsPerPage="onItemsPerPageChange"
  :showExport="false"
  :showNewButton="false"
        :headers="headers"
      >
        <template #actions v-if="isDocumentacion">
          <UButton label="Importar productos" icon="i-heroicons-plus" color="primary" variant="solid" class="h-11 font-normal" @click="goToArchivos" />
        </template>
      </DataTable>
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
  <!-- Modal de observaciones fuera del contenido principal -->
  <DynamicModal
    :visible="showModal"
    :modal="modalData"
    @close="showModal = false"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, h, resolveComponent } from 'vue'
import DataTable from '~/components/DataTable.vue'
import LazyImage from '~/components/LazyImage.vue'
import { ProductService } from '~/services/productService'
import type { ProductMapped } from '~/types/product'
import DynamicModal from '~/components/DynamicModal.vue'
import ImageModal from '~/components/ImageModal.vue'
import { useUserRole } from '~/composables/auth/useUserRole'
import type { ModalData } from '~/composables/commons/useModal'
const userRole = useUserRole()
const UButton = resolveComponent('UButton')

// Constante de roles
const { hasRole, isDocumentacion } = useUserRole()


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

// Toggle para mostrar/ocultar filtros
const showFilters = ref(false)

// Paginación local (para manejar el v-model de UPagination)
const localCurrentPage = ref(1)

// Estado para el modal de imagen
const showImageModal = ref(false)
const selectedImage = ref('')
const selectedImageTitle = ref('')

//Estado para el modal de mensajes
const showModal = ref(false)

const modalData = ref<ModalData>({
  id: Date.now().toString(),
  title: 'Observaciones',
  message: '',
  type: 'info', // o el tipo que necesites
  persistent: false
})

// Configuración de filtros para el componente DataTable
const filterConfig = computed(() => [
  {
    key: 'rubro',
    label: 'Rubro',
    placeholder: 'Seleccionar rubro',
    options: [
      { label: 'Todos', value: 'todos', text: 'Todos' },
      ...filterOptions.value.rubros.map(rubro => ({ label: rubro, value: rubro, text: rubro }))
    ]
  },
  {
    key: 'tipoProducto',
    label: 'Tipo Producto',
    placeholder: 'Seleccionar tipo',
    options: [
      { label: 'Todos', value: 'todos', text: 'Todos' },
      ...filterOptions.value.tiposProducto.map(tipo => ({ label: tipo, value: tipo, text: tipo }))
    ]
  },
  {
    key: 'campana',
    label: 'Campaña',
    placeholder: 'Seleccionar campaña',
    options: [
      { label: 'Todos', value: 'todos', text: 'Todos' },
      ...filterOptions.value.campanas.map(campana => ({ label: campana, value: campana, text: campana }))
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

// DataTable columns and rows mapping
const tableColumns = computed(() => [
  { header: 'N°', accessorKey: 'index' },
  {
    header: 'Foto',
    accessorKey: 'foto',
    cell: ({ row }: any) => {
      const url = row.original.foto
      if (!url) return 'Sin foto'
      return h(LazyImage, {
        src: url,
        alt: row.original.nombreComercial,
        width: 80,
        height: 80,
        class: 'w-20 h-20 object-cover rounded cursor-pointer',
        onClick: () => openImageModal(url, row.original.nombreComercial)
      })
    }
  },
  { header: 'Nombre comercial', accessorKey: 'nombreComercial' },
  { header: 'Rubro', accessorKey: 'rubro' },
  { header: 'T. Producto', accessorKey: 'tipoProducto' },
  { header: 'Unidad Com.', accessorKey: 'unidadComercial' },
  { header: 'Subpartida', accessorKey: 'subpartida' },
  { header: 'Campaña', accessorKey: 'cargaContenedor', cell: ({ row }: any) => `#${row.original.cargaContenedor}` },
  {
    header: 'Acciones',
    accessorKey: 'acciones',
    cell: ({ row }: any) => h('div', { class: 'flex gap-2 items-center justify-center' }, [
      h(UButton, { icon: 'i-heroicons-eye', size: 'xs', color: 'neutral', variant: 'soft', onClick: () => viewProduct(row.original) }),
      hasRole('Documentacion') ? h(UButton, { icon: 'i-heroicons-trash', size: 'xs', color: 'error', variant: 'soft', onClick: () => deleteProduct(row.original) }) : null,
      h(UButton, { icon: 'i-heroicons-bell', size: 'xs', color: row.original.tiene_observaciones ? 'warning' : 'neutral', variant: 'soft', onClick: () => showObservations(row.original) })
    ])
  }
])

const tableRows = computed(() => filteredProducts.value.map((p, idx) => ({ ...p, index: idx + 1 })))

const onPrimarySearchUpdate = (val: string) => {
  searchQuery.value = val
  // handleSearch expects the query string
  handleSearch && handleSearch(val)
}

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

  // Load the requested page; DataTable will call the provided prefetchNextPage
  // callback to preload the next page's images (if available).
  loadProducts({ page })
}

// Helper: preload a single image (returns a promise that resolves on load/error)
const preloadImage = (url: string) => {
  return new Promise<void>((resolve) => {
    try {
      const i = new Image()
      i.onload = () => resolve()
      i.onerror = () => resolve()
      i.src = url
    } catch (e) {
      resolve()
    }
  })
}

// Prefetch images for a given page number (uses ProductService directly so we don't alter state)
const prefetchImagesForPage = async (page: number) => {
  try {
    const resp = await ProductService.getProducts({ page, limit: itemsPerPage.value })
    if (resp.success && Array.isArray(resp.data)) {
      const urls = resp.data.map((p: any) => p.foto).filter((u: any) => !!u)
      // preload asynchronously but limit concurrency to avoid spiking connections
      const CONCURRENCY = 6
      for (let i = 0; i < urls.length; i += CONCURRENCY) {
        const chunk = urls.slice(i, i + CONCURRENCY)
        await Promise.all(chunk.map((u: string) => preloadImage(u)))
      }
    }
  } catch (err) {
    // ignore prefetch errors
    console.warn('Prefetch images failed:', err)
  }
}

const onFiltersUpdate = (newFilters: Record<string, any>) => {
  // sincronizar con el composable y aplicar
  Object.keys(newFilters || {}).forEach(k => {
    ;(filters.value as any)[k] = newFilters[k]
  })
  // eliminar keys que vienen como undefined
  Object.keys(filters.value).forEach(k => {
    if ((filters.value as any)[k] === undefined) delete (filters.value as any)[k]
  })
  applyFilters()
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

function showObservations(product: ProductMapped) {
  if (product.tiene_observaciones && product.observaciones) {
    modalData.value.message = Array.isArray(product.observaciones)
      ? product.observaciones.join('\n')
      : product.observaciones
  } else {
    modalData.value.message = 'No hay observaciones'
  }
  showModal.value = true
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