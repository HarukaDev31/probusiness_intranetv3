<template>
  <div class="relative flex flex-col h-full">
    <!-- Contenedor del gráfico con altura fija -->
    <div class="flex-1 min-h-0">
      <canvas ref="chartCanvas" class="w-full h-full"></canvas>
    </div>
    
    <!-- Controles de paginación con altura fija -->
    <div v-if="totalPages > 1" class="flex items-center justify-between mt-4 px-4 h-10 flex-shrink-0">
      <div class="text-sm text-gray-600 dark:text-gray-400">
        Mostrando {{ startIndex + 1 }}-{{ endIndex }} de {{ totalDays }} días
      </div>
      
      <div class="flex items-center gap-2">
        <UButton
          :disabled="currentPage === 1"
          icon="i-heroicons-chevron-left"
          size="sm"
          variant="ghost"
          @click="previousPage"
        />
        
        <div class="flex items-center gap-1">
          <UButton
            v-for="page in visiblePages"
            :key="page"
            :variant="page === currentPage ? 'solid' : 'ghost'"
            :color="page === currentPage ? 'primary' : 'neutral'"
            size="sm"
            :label="page.toString()"
            @click="goToPage(page)"
          />
        </div>
        
        <UButton
          :disabled="currentPage === totalPages"
          icon="i-heroicons-chevron-right"
          size="sm"
          variant="ghost"
          @click="nextPage"
        />
      </div>
      
      <div class="text-sm text-gray-600 dark:text-gray-400">
        Página {{ currentPage }} de {{ totalPages }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData
} from 'chart.js'

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  LineController,
  Title,
  Tooltip,
  Legend
)

interface Props {
  data: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      backgroundColor: string
      borderColor: string
      borderWidth: number
      fill: boolean
      tension: number
      yAxisID?: string
      type?: string
      borderDash?: number[]
    }>
  } | null
  height?: number
  daysPerPage?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 400,
  daysPerPage: 15
})

const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: ChartJS | null = null

// Estado de paginación
const currentPage = ref(1)

// Computed properties para paginación
const totalDays = computed(() => props.data?.labels.length || 0)
const totalPages = computed(() => Math.ceil(totalDays.value / props.daysPerPage))
const startIndex = computed(() => (currentPage.value - 1) * props.daysPerPage)
const endIndex = computed(() => Math.min(startIndex.value + props.daysPerPage, totalDays.value))

// Datos paginados
const paginatedLabels = computed(() => {
  if (!props.data) return []
  return props.data.labels.slice(startIndex.value, endIndex.value)
})

const paginatedDatasets = computed(() => {
  if (!props.data) return []
  return props.data.datasets.map(dataset => ({
    ...dataset,
    data: dataset.data.slice(startIndex.value, endIndex.value)
  }))
})

// Páginas visibles en la paginación
const visiblePages = computed(() => {
  const pages = []
  const maxVisiblePages = 5
  let startPage = Math.max(1, currentPage.value - Math.floor(maxVisiblePages / 2))
  let endPage = Math.min(totalPages.value, startPage + maxVisiblePages - 1)
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }
  
  return pages
})

// Procesar los datos para Chart.js
const chartData = computed((): ChartData<'line'> => {
  if (!props.data) {
    return {
      labels: [],
      datasets: []
    }
  }

  return {
    labels: paginatedLabels.value,
    datasets: paginatedDatasets.value.map(dataset => ({
      ...dataset,
      type: 'line' as const
    }))
  }
})

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false
  },
  plugins: {
    title: {
      display: false
    },
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 20,
        generateLabels: function(chart) {
          const original = ChartJS.defaults.plugins.legend.labels.generateLabels
          const labels = original.call(this, chart)
          
          // Agrupar las etiquetas por vendedor
          const groupedLabels: any[] = []
          const vendedores = new Set<string>()
          
          labels.forEach(label => {
            const vendedor = label.text.split(' (')[0]
            vendedores.add(vendedor)
          })
          
          vendedores.forEach(vendedor => {
            const cotizacionesLabel = labels.find(l => l.text.includes(`${vendedor} (Cotizaciones)`))
            const cbmLabel = labels.find(l => l.text.includes(`${vendedor} (CBM)`))
            
            if (cotizacionesLabel) {
              groupedLabels.push({
                ...cotizacionesLabel,
                text: vendedor
              })
            }
          })
          
          return groupedLabels
        }
      }
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        title: function(context) {
          return `Fecha: ${context[0].label}`
        },
        label: function(context) {
          const label = context.dataset.label || ''
          const value = context.parsed.y
          
          if (label.includes('Cotizaciones')) {
            return `${label}: ${value} cotizaciones`
          } else if (label.includes('CBM')) {
            return `${label}: ${value.toFixed(2)} m³`
          }
          
          return `${label}: ${value}`
        }
      }
    }
  },
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: 'Fecha'
      },
      grid: {
        display: false
      },
      ticks: {
        maxRotation: 45,
        minRotation: 0
      }
    },
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      title: {
        display: true,
        text: 'Cotizaciones'
      },
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      },
      ticks: {
        stepSize: 1,
        callback: function(value) {
          return `${value}`
        }
      }
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      title: {
        display: true,
        text: 'Volumen CBM (m³)'
      },
      beginAtZero: true,
      grid: {
        drawOnChartArea: false
      },
      ticks: {
        callback: function(value) {
          return `${value} m³`
        }
      }
    }
  }
}

const createChart = () => {
  if (!chartCanvas.value) return

  if (chartInstance) {
    chartInstance.destroy()
  }

  chartInstance = new ChartJS(chartCanvas.value, {
    type: 'line',
    data: chartData.value,
    options: chartOptions
  })
}

const updateChart = () => {
  if (chartInstance && props.data) {
    chartInstance.data = chartData.value
    chartInstance.update('none')
  }
}

// Métodos de navegación
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

// Watchers
watch(() => props.data, () => {
  // Resetear a la primera página cuando cambien los datos
  currentPage.value = 1
  if (props.data) {
    updateChart()
  }
}, { deep: true })

watch(currentPage, () => {
  updateChart()
})

// Lifecycle
onMounted(() => {
  if (props.data) {
    createChart()
  }
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})
</script>
