<template>
  <div class="p-6 max-w-7xl mx-auto">
    <h1 class="text-3xl font-bold mb-8">Demo: Web Workers en Acción</h1>

    <!-- Estado del Worker -->
    <UCard class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold mb-2">Estado del Worker</h3>
          <div class="flex items-center gap-4">
            <UBadge :color="dataWorker.isReady.value ? 'green' : 'red'" variant="solid">
              {{ dataWorker.isReady.value ? '✓ Listo' : '⏳ Inicializando...' }}
            </UBadge>
            <UBadge v-if="dataWorker.isProcessing.value" color="blue" variant="solid" class="animate-pulse">
              ⚡ Procesando...
            </UBadge>
          </div>
        </div>
        <UButton @click="dataWorker.restart" size="sm" variant="outline">
          Reiniciar Worker
        </UButton>
      </div>
    </UCard>

    <!-- Demo 1: Filtrado de Datos Grandes -->
    <UCard class="mb-6">
      <template #header>
        <h2 class="text-xl font-semibold">1. Filtrado de {{ largeDataset.length.toLocaleString() }} Registros</h2>
      </template>

      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UInput
            v-model="searchTerm"
            placeholder="Buscar por nombre, email..."
            icon="i-heroicons-magnifying-glass"
          />
          <USelect
            v-model="selectedCategory"
            :options="categoryOptions"
            placeholder="Categoría"
          />
          <USelect
            v-model="selectedEstado"
            :options="estadoOptions"
            placeholder="Estado"
          />
        </div>

        <div class="flex gap-4">
          <UButton
            @click="filterWithWorker"
            :loading="isFiltering"
            :disabled="!dataWorker.isReady.value"
            color="primary"
          >
            Filtrar con Worker
          </UButton>
          <UButton
            @click="filterWithoutWorker"
            :loading="isFilteringSync"
            color="gray"
          >
            Filtrar Sin Worker (bloqueante)
          </UButton>
        </div>

        <div v-if="performanceMetrics.workerTime || performanceMetrics.syncTime" class="grid grid-cols-2 gap-4">
          <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-gray-400">Con Worker</p>
            <p class="text-2xl font-bold text-green-600">{{ performanceMetrics.workerTime }}ms</p>
            <p class="text-xs text-gray-500">UI responsiva ✓</p>
          </div>
          <div class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-gray-400">Sin Worker</p>
            <p class="text-2xl font-bold text-orange-600">{{ performanceMetrics.syncTime }}ms</p>
            <p class="text-xs text-gray-500">UI bloqueada ✗</p>
          </div>
        </div>

        <div v-if="filteredResults.length > 0" class="mt-4">
          <p class="font-semibold mb-2">Resultados: {{ filteredResults.length }} registros</p>
          <div class="max-h-64 overflow-auto border border-gray-200 dark:border-gray-700 rounded">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">ID</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Nombre</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Categoría</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Estado</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Monto</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="item in filteredResults.slice(0, 100)" :key="item.id">
                  <td class="px-4 py-2 text-sm">{{ item.id }}</td>
                  <td class="px-4 py-2 text-sm">{{ item.nombre }}</td>
                  <td class="px-4 py-2 text-sm">{{ item.email }}</td>
                  <td class="px-4 py-2 text-sm">
                    <UBadge :label="item.categoria" size="xs" />
                  </td>
                  <td class="px-4 py-2 text-sm">
                    <UBadge :label="item.estado" :color="item.estado === 'activo' ? 'green' : 'gray'" size="xs" />
                  </td>
                  <td class="px-4 py-2 text-sm">${{ item.monto.toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="filteredResults.length > 100" class="text-xs text-gray-500 mt-2">
            Mostrando primeros 100 de {{ filteredResults.length }} resultados
          </p>
        </div>
      </div>
    </UCard>

    <!-- Demo 2: Agregaciones -->
    <UCard class="mb-6">
      <template #header>
        <h2 class="text-xl font-semibold">2. Agregaciones Rápidas</h2>
      </template>

      <div class="space-y-4">
        <UButton
          @click="calculateAggregations"
          :loading="isCalculating"
          :disabled="!dataWorker.isReady.value"
        >
          Calcular Estadísticas
        </UButton>

        <div v-if="aggregations.calculated" class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-gray-400">Total</p>
            <p class="text-2xl font-bold text-blue-600">${{ aggregations.sum.toLocaleString() }}</p>
          </div>
          <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-gray-400">Promedio</p>
            <p class="text-2xl font-bold text-green-600">${{ aggregations.avg.toFixed(2) }}</p>
          </div>
          <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-gray-400">Mínimo</p>
            <p class="text-2xl font-bold text-purple-600">${{ aggregations.min.toFixed(2) }}</p>
          </div>
          <div class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-gray-400">Máximo</p>
            <p class="text-2xl font-bold text-orange-600">${{ aggregations.max.toFixed(2) }}</p>
          </div>
        </div>

        <p v-if="performanceMetrics.aggregationTime" class="text-sm text-gray-600">
          ⚡ Calculado en {{ performanceMetrics.aggregationTime }}ms
        </p>
      </div>
    </UCard>

    <!-- Demo 3: Ordenamiento -->
    <UCard>
      <template #header>
        <h2 class="text-xl font-semibold">3. Ordenamiento Inteligente</h2>
      </template>

      <div class="space-y-4">
        <div class="flex gap-4">
          <USelect
            v-model="sortBy"
            :options="sortOptions"
            placeholder="Ordenar por"
            class="flex-1"
          />
          <UButton
            @click="sortData"
            :loading="isSorting"
            :disabled="!dataWorker.isReady.value"
          >
            Ordenar
          </UButton>
        </div>

        <p v-if="performanceMetrics.sortTime" class="text-sm text-gray-600">
          ⚡ Ordenado en {{ performanceMetrics.sortTime }}ms
        </p>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useDataWorker } from '~/composables/useDataWorker'

definePageMeta({
  layout: 'default',
  middleware: ['auth']
})

// Web Worker
const dataWorker = useDataWorker()

// Dataset grande (simulado)
const largeDataset = ref<any[]>([])
const generateLargeDataset = () => {
  const categorias = ['Premium', 'Regular', 'VIP', 'Básico']
  const estados = ['activo', 'inactivo', 'pendiente']
  
  return Array.from({ length: 5000 }, (_, i) => ({
    id: i + 1,
    nombre: `Cliente ${i + 1}`,
    email: `cliente${i + 1}@ejemplo.com`,
    categoria: categorias[Math.floor(Math.random() * categorias.length)],
    estado: estados[Math.floor(Math.random() * estados.length)],
    monto: Math.random() * 10000,
    fecha: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }))
}

// Estado
const searchTerm = ref('')
const selectedCategory = ref('todos')
const selectedEstado = ref('todos')
const filteredResults = ref<any[]>([])
const isFiltering = ref(false)
const isFilteringSync = ref(false)
const isCalculating = ref(false)
const isSorting = ref(false)
const sortBy = ref('nombre')

const performanceMetrics = reactive({
  workerTime: 0,
  syncTime: 0,
  aggregationTime: 0,
  sortTime: 0
})

const aggregations = reactive({
  sum: 0,
  avg: 0,
  min: 0,
  max: 0,
  calculated: false
})

// Opciones
const categoryOptions = [
  { label: 'Todos', value: 'todos' },
  { label: 'Premium', value: 'Premium' },
  { label: 'Regular', value: 'Regular' },
  { label: 'VIP', value: 'VIP' },
  { label: 'Básico', value: 'Básico' }
]

const estadoOptions = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activo', value: 'activo' },
  { label: 'Inactivo', value: 'inactivo' },
  { label: 'Pendiente', value: 'pendiente' }
]

const sortOptions = [
  { label: 'Nombre', value: 'nombre' },
  { label: 'Monto', value: 'monto' },
  { label: 'Fecha', value: 'fecha' }
]

// Filtrar con Worker
const filterWithWorker = async () => {
  isFiltering.value = true
  const startTime = performance.now()
  
  try {
    const filters: Record<string, any> = {}
    if (selectedCategory.value !== 'todos') filters.categoria = selectedCategory.value
    if (selectedEstado.value !== 'todos') filters.estado = selectedEstado.value

    let result = largeDataset.value

    // Aplicar filtros
    if (Object.keys(filters).length > 0) {
      result = await dataWorker.filterData(result, filters)
    }

    // Aplicar búsqueda
    if (searchTerm.value) {
      result = await dataWorker.searchData(result, searchTerm.value, ['nombre', 'email'])
    }

    filteredResults.value = result
    performanceMetrics.workerTime = Math.round(performance.now() - startTime)
  } finally {
    isFiltering.value = false
  }
}

// Filtrar sin Worker (bloqueante)
const filterWithoutWorker = () => {
  isFilteringSync.value = true
  const startTime = performance.now()
  
  // Forzar un delay para simular bloqueo
  setTimeout(() => {
    let result = largeDataset.value

    // Filtros
    if (selectedCategory.value !== 'todos') {
      result = result.filter(item => item.categoria === selectedCategory.value)
    }
    if (selectedEstado.value !== 'todos') {
      result = result.filter(item => item.estado === selectedEstado.value)
    }

    // Búsqueda
    if (searchTerm.value) {
      const term = searchTerm.value.toLowerCase()
      result = result.filter(item =>
        item.nombre.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term)
      )
    }

    filteredResults.value = result
    performanceMetrics.syncTime = Math.round(performance.now() - startTime)
    isFilteringSync.value = false
  }, 0)
}

// Calcular agregaciones
const calculateAggregations = async () => {
  isCalculating.value = true
  const startTime = performance.now()
  
  try {
    const dataToAggregate = filteredResults.value.length > 0 ? filteredResults.value : largeDataset.value
    
    const [sum, avg, min, max] = await Promise.all([
      dataWorker.aggregateData(dataToAggregate, 'monto', 'sum'),
      dataWorker.aggregateData(dataToAggregate, 'monto', 'avg'),
      dataWorker.aggregateData(dataToAggregate, 'monto', 'min'),
      dataWorker.aggregateData(dataToAggregate, 'monto', 'max')
    ])
    
    aggregations.sum = sum
    aggregations.avg = avg
    aggregations.min = min
    aggregations.max = max
    aggregations.calculated = true
    
    performanceMetrics.aggregationTime = Math.round(performance.now() - startTime)
  } finally {
    isCalculating.value = false
  }
}

// Ordenar datos
const sortData = async () => {
  isSorting.value = true
  const startTime = performance.now()
  
  try {
    const dataToSort = filteredResults.value.length > 0 ? filteredResults.value : largeDataset.value
    filteredResults.value = await dataWorker.sortData(dataToSort, sortBy.value, 'asc')
    performanceMetrics.sortTime = Math.round(performance.now() - startTime)
  } finally {
    isSorting.value = false
  }
}

// Inicializar
onMounted(() => {
  largeDataset.value = generateLargeDataset()
  filteredResults.value = largeDataset.value
})
</script>

