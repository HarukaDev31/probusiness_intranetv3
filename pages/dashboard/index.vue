<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Dashboard de Ventas Consolidado
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Seguimiento de métricas de volumen y totales por contenedor, fecha y vendedor
      </p>
    </div>

    <!-- Filtros -->
    <UCard class="mb-6">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Filtros</h3>
          <UButton
            icon="i-heroicons-funnel"
            label="Aplicar Filtros"
            color="primary"
            @click="applyFilters"
          />
        </div>
      </template>
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <template v-if="loading">
          <!-- Skeleton para filtros -->
          <div v-for="i in 4" :key="i">
            <USkeleton class="h-4 w-20 mb-2" />
            <USkeleton class="h-10 w-full rounded-md" />
          </div>
        </template>
        
        <template v-else>
          <!-- Filtro de Contenedor -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contenedor
            </label>
            <USelect
              v-model="selectedContenedor"
              :items="filtrosContenedores"
              placeholder="Seleccionar contenedor"
              option-attribute="label"
              value-attribute="value"
              class="w-full"
              @update:model-value="applyFilters"
            />
          </div>

          <!-- Filtro de Vendedor -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vendedor
            </label>
            <USelect
              v-model="selectedVendedor"
              :items="filtrosVendedores"
              placeholder="Seleccionar vendedor"
              option-attribute="label"
              value-attribute="value"
              class="w-full"
              @update:model-value="applyFilters"
            />
          </div>

          <!-- Filtro de Fecha Inicio -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha Inicio
            </label>
            <UInput
              v-model="fechaInicio"
              type="date"
              placeholder="Fecha inicio"
              class="w-full"
              @update:model-value="applyFilters"
            />
          </div>

          <!-- Filtro de Fecha Fin -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha Fin
            </label>
            <UInput
              v-model="fechaFin"
              type="date"
              placeholder="Fecha fin"
              class="w-full"
              @update:model-value="applyFilters"
            />
          </div>
        </template>
      </div>
    </UCard>

    <!-- Métricas Principales -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <template v-if="loading">
        <!-- Skeleton para métricas -->
        <UCard v-for="i in 6" :key="i">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <USkeleton class="h-4 w-24 mb-2" />
              <USkeleton class="h-8 w-32" />
            </div>
            <div class="text-right">
              <USkeleton class="h-4 w-12 mb-1" />
              <USkeleton class="h-4 w-4" />
            </div>
          </div>
        </UCard>
      </template>
      
      <template v-else>
        <!-- Volumen China -->
        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Volumen China</p>
              <p class="text-2xl font-bold text-blue-600">{{ formatVolume(metricas.volumenChina) }}</p>
            </div>
            <div class="text-right">
              <span class="text-green-500 text-sm font-medium">+12.5%</span>
              <UIcon name="i-heroicons-arrow-trending-up" class="text-green-500 ml-1" />
            </div>
          </div>
        </UCard>

        <!-- Volumen Vendido -->
        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Volumen Vendido</p>
              <p class="text-2xl font-bold text-blue-600">{{ formatVolume(metricas.volumenVendido) }}</p>
            </div>
            <div class="text-right">
              <span class="text-green-500 text-sm font-medium">+8.3%</span>
              <UIcon name="i-heroicons-arrow-trending-up" class="text-green-500 ml-1" />
            </div>
          </div>
        </UCard>

        <!-- Volumen Pendiente -->
        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Volumen Pendiente</p>
              <p class="text-2xl font-bold text-orange-600">{{ formatVolume(metricas.volumenPendiente) }}</p>
            </div>
            <div class="text-right">
              <span class="text-red-500 text-sm font-medium">-15.2%</span>
              <UIcon name="i-heroicons-arrow-trending-down" class="text-red-500 ml-1" />
            </div>
          </div>
        </UCard>

        <!-- Total Ventas -->
        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Fob</p>
              <p class="text-2xl font-bold text-purple-600">{{ formatCurrency(metricas.totalVentas, 'USD') }}</p>
            </div>
            <div class="text-right">
              <span class="text-green-500 text-sm font-medium">+18.7%</span>
              <UIcon name="i-heroicons-arrow-trending-up" class="text-green-500 ml-1" />
            </div>
          </div>
        </UCard>

        <!-- Total Impuestos -->
        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Impuestos</p>
              <p class="text-2xl font-bold text-red-600">{{ formatCurrency(metricas.totalImpuestos) }}</p>
            </div>
            <div class="text-right">
              <span class="text-red-500 text-sm font-medium">-5.4%</span>
              <UIcon name="i-heroicons-arrow-trending-down" class="text-red-500 ml-1" />
            </div>
          </div>
        </UCard>

        <!-- Total Logística -->
        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Logística</p>
              <p class="text-2xl font-bold text-blue-600">{{ formatCurrency(metricas.totalLogistica) }}</p>
            </div>
            <div class="text-right">
              <span class="text-red-500 text-sm font-medium">-2.1%</span>
              <UIcon name="i-heroicons-arrow-trending-down" class="text-red-500 ml-1" />
            </div>
          </div>
        </UCard>
      </template>
    </div>

    <!-- Gráficos -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- Gráfico de Volúmenes por Contenedor -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Evolución de Volúmenes por Contenedor</h3>
        </template>
        
        <div class="h-96">
          <template v-if="loading">
            <!-- Skeleton para gráfico de barras -->
            <div class="h-full flex flex-col">
              <div class="flex-1 p-4">
                <div class="flex items-end justify-center space-x-2 h-full">
                  <USkeleton class="w-8 h-32" />
                  <USkeleton class="w-8 h-24" />
                  <USkeleton class="w-8 h-40" />
                  <USkeleton class="w-8 h-28" />
                  <USkeleton class="w-8 h-36" />
                  <USkeleton class="w-8 h-20" />
                  <USkeleton class="w-8 h-44" />
                  <USkeleton class="w-8 h-32" />
                </div>
              </div>
              <div class="h-10 flex items-center justify-between px-4">
                <USkeleton class="h-4 w-32" />
                <div class="flex space-x-2">
                  <USkeleton class="h-6 w-6 rounded" />
                  <USkeleton class="h-6 w-6 rounded" />
                  <USkeleton class="h-6 w-6 rounded" />
                </div>
                <USkeleton class="h-4 w-20" />
              </div>
            </div>
          </template>
          <template v-else>
            <VolumeBarChart 
              v-if="datosGraficoVolumenes.length > 0"
              :data="datosGraficoVolumenes" 
              :items-per-page="8"
            />
            <div v-else class="h-full flex items-center justify-center">
              <div class="text-center text-gray-500">
                <UIcon name="i-heroicons-chart-bar" class="text-4xl mb-2" />
                <p>No hay datos para mostrar</p>
              </div>
            </div>
          </template>
        </div>
      </UCard>

      <!-- Gráfico de Distribución por Vendedor -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Distribución de Ventas por Vendedor</h3>
        </template>
        
        <div class="h-64">
          <template v-if="loading">
            <!-- Skeleton para gráfico circular -->
            <div class="h-full flex items-center justify-center">
              <div class="flex items-center space-x-8">
                <USkeleton class="w-32 h-32 rounded-full" />
                <div class="space-y-2">
                  <div v-for="i in 4" :key="i" class="flex items-center space-x-2">
                    <USkeleton class="w-3 h-3 rounded-full" />
                    <USkeleton class="h-4 w-20" />
                  </div>
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <SalesPieChart 
              v-if="datosGraficoVendedores.length > 0"
              :data="datosGraficoVendedores" 
              :height="256"
            />
            <div v-else class="h-full flex items-center justify-center">
              <div class="text-center text-gray-500">
                <UIcon name="i-heroicons-chart-pie" class="text-4xl mb-2" />
                <p>No hay datos para mostrar</p>
              </div>
            </div>
          </template>
        </div>
      </UCard>
    </div>

    <!-- Gráfico de Progreso Diario -->
    <div class="mb-8">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Progreso Diario de Cotizaciones Confirmadas</h3>
        </template>
        
        <div class="h-96">
          <template v-if="loading">
            <!-- Skeleton para gráfico de líneas -->
            <div class="h-full flex flex-col">
              <div class="flex-1 p-4">
                <div class="flex items-end justify-center space-x-1 h-full">
                  <div v-for="i in 15" :key="i" class="flex flex-col items-center space-y-1">
                    <USkeleton :class="`w-2 h-${Math.floor(Math.random() * 20) + 10}`" />
                    <USkeleton class="w-4 h-2" />
                  </div>
                </div>
              </div>
              <div class="h-10 flex items-center justify-between px-4">
                <USkeleton class="h-4 w-48" />
                <div class="flex space-x-4">
                  <div class="flex items-center space-x-2">
                    <USkeleton class="h-3 w-3 rounded-full" />
                    <USkeleton class="h-4 w-20" />
                  </div>
                  <div class="flex items-center space-x-2">
                    <USkeleton class="h-3 w-3 rounded-full" />
                    <USkeleton class="h-4 w-16" />
                  </div>
                </div>
                <USkeleton class="h-4 w-24" />
              </div>
            </div>
          </template>
          <template v-else>
            <DailyProgressChart 
              v-if="datosGraficoProgresoDiario"
              :data="datosGraficoProgresoDiario" 
              :height="384"
              :days-per-page="15"
            />
            <div v-else class="h-full flex items-center justify-center">
              <div class="text-center text-gray-500">
                <UIcon name="i-heroicons-chart-line" class="text-4xl mb-2" />
                <p>No hay datos para mostrar</p>
              </div>
            </div>
          </template>
        </div>
      </UCard>
    </div>

    <!-- Tabla de Detalle de Transacciones -->
    <template v-if="loading">
      <!-- Skeleton para tabla -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <USkeleton class="h-6 w-48 mb-1" />
              <USkeleton class="h-4 w-64" />
            </div>
            <div class="flex items-center gap-2">
              <USkeleton class="h-10 w-64" />
            </div>
          </div>
        </template>
        
        <div class="space-y-4">
          <!-- Header de tabla skeleton -->
          <div class="grid grid-cols-8 gap-4 pb-2 border-b">
            <USkeleton v-for="i in 8" :key="i" class="h-4 w-full" />
          </div>
          
          <!-- Filas de tabla skeleton -->
          <div v-for="row in 5" :key="row" class="grid grid-cols-8 gap-4 py-3">
            <USkeleton v-for="col in 8" :key="col" class="h-4 w-full" />
          </div>
        </div>
      </UCard>
    </template>
    
    <template v-else>
      <DataTable 
        title="Detalle de Transacciones" 
        subtitle="Transacciones detalladas por contenedor y vendedor"
        icon="i-heroicons-table-cells"
        :show-title="true" 
        :data="resumenData" 
        :columns="transactionColumns" 
        :loading="false" 
        :current-page="1"
        :total-pages="1" 
        :total-records="resumenData.length" 
        :items-per-page="50"
        :search-query-value="searchQuery" 
        :show-primary-search="true" 
        :primary-search-label="'Buscar por'"
        :primary-search-placeholder="'Buscar por vendedor o contenedor...'" 
        :show-filters="false" 
        :show-export="true"
        :show-new-button="false"
        empty-state-message="No se encontraron transacciones."
        @update:primarySearch="(query: string) => searchQuery = query" 
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useDashboard } from '~/composables/useDashboard'

// Lazy load componentes de gráficos para mejorar tiempo de carga inicial
const VolumeBarChart = defineAsyncComponent(() => import('~/components/charts/VolumeBarChart.vue'))
const SalesPieChart = defineAsyncComponent(() => import('~/components/charts/SalesPieChart.vue'))
const DailyProgressChart = defineAsyncComponent(() => import('~/components/charts/DailyProgressChart.vue'))

// Composables
const {
  loading,
  resumenData,
  filtrosContenedores,
  filtrosVendedores,
  metricas,
  datosGraficoVolumenes,
  datosGraficoVendedores,
  datosGraficoProgresoDiario,
  loadDashboardData,
  updateFilters,
  formatVolume,
  formatCurrency
} = useDashboard()

// Estado local
const selectedContenedor = ref<number | null>(null) // Iniciar con "Todos"
const selectedVendedor = ref<number | null>(null)   // Iniciar con "Todos"
const fechaInicio = ref('')
const fechaFin = ref('')
const searchQuery = ref('')

// Columnas de la tabla
const transactionColumns: TableColumn<any>[] = [
  {
    accessorKey: 'fecha_zarpe',
    header: 'Fecha',
    cell: ({ row }) => row.getValue('fecha_zarpe')
  },
  {
    accessorKey: 'vendedor',
    header: 'Vendedor',
    cell: ({ row }) => row.getValue('vendedor')
  },
  {
    accessorKey: 'carga',
    header: 'Contenedor',
    cell: ({ row }) => row.getValue('carga')
  },
  {
    accessorKey: 'volumenes',
    header: 'Vol. Vendido (m³)',
    cell: ({ row }) => formatVolume((row.getValue('volumenes') as any).vendido)
  },
  {
    accessorKey: 'volumenes',
    header: 'Vol. Pendiente (m³)',
    cell: ({ row }) => formatVolume((row.getValue('volumenes') as any).pendiente)
  },
  {
    accessorKey: 'totales',
    header: 'Total ($)',
    cell: ({ row }) => formatCurrency((row.getValue('totales') as any).fob, 'USD')
  },
  {
    accessorKey: 'totales',
    header: 'Impuestos ($)',
    cell: ({ row }) => formatCurrency((row.getValue('totales') as any).impuestos, 'USD')
  },
  {
    accessorKey: 'totales',
    header: 'Logística ($)',
    cell: ({ row }) => formatCurrency((row.getValue('totales') as any).logistica, 'USD')
  }
]

// Métodos
const applyFilters = () => {
  updateFilters({
    fecha_inicio: fechaInicio.value || undefined,
    fecha_fin: fechaFin.value || undefined,
    id_vendedor: selectedVendedor.value,
    id_contenedor: selectedContenedor.value
  })
}

// Lifecycle
onMounted(() => {
  loadDashboardData()
})
</script>
