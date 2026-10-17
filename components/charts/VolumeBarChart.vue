<template>
  <div class="relative flex flex-col h-full">
    <!-- Contenedor del gráfico con altura fija -->
    <div class="flex-1 min-h-0">
      <canvas ref="chartCanvas" class="w-full h-full"></canvas>
    </div>
    
    <!-- Controles de paginación con altura fija -->
    <div v-if="totalPages > 1" class="flex items-center justify-between mt-4 px-4 h-10 flex-shrink-0">
      <div class="text-sm text-gray-600 dark:text-gray-400">
          Mostrando {{ startIndex + 1 }}-{{ endIndex }} de {{ totalItems }} {{ itemNoun }}
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
import { ref, onMounted, watch, onUnmounted } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
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
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend
)

interface VolumeData {
  contenedor: string
  volumenChina: number
  volumenVendido: number
  volumenPendiente: number
}

interface Props {
  data: VolumeData[]
  itemsPerPage?: number
  unit?: string
  decimals?: number
  itemNoun?: string
  labelChina?: string
  labelVendido?: string
  labelPendiente?: string
  showChina?: boolean
  showVendido?: boolean
  showPendiente?: boolean
  selectable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  itemsPerPage: 10,
  unit: 'm³',
  decimals: 2,
  itemNoun: 'contenedores',
  labelChina: 'Volumen China',
  labelVendido: 'Volumen Vendido',
  labelPendiente: 'Volumen Pendiente',
  showChina: true,
  showVendido: true,
  showPendiente: true,
  selectable: false
})

const emit = defineEmits<{ select: [label: string] }>()

const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: ChartJS | null = null

// Estado de paginación
const currentPage = ref(1)

// Computed properties para paginación
const totalItems = computed(() => props.data.length)
const totalPages = computed(() => Math.ceil(totalItems.value / props.itemsPerPage))
const startIndex = computed(() => (currentPage.value - 1) * props.itemsPerPage)
const endIndex = computed(() => Math.min(startIndex.value + props.itemsPerPage, totalItems.value))

// Datos paginados
const paginatedData = computed(() => {
  return props.data.slice(startIndex.value, endIndex.value)
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

const chartData = computed((): ChartData<'bar'> => {
  const datasets: ChartData<'bar'>['datasets'] = []
  if (props.showChina) {
    datasets.push({
      label: props.labelChina,
      data: paginatedData.value.map(item => item.volumenChina),
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1
    })
  }
  if (props.showVendido) {
    datasets.push({
      label: props.labelVendido,
      data: paginatedData.value.map(item => item.volumenVendido),
      backgroundColor: 'rgba(16, 185, 129, 0.8)',
      borderColor: 'rgba(16, 185, 129, 1)',
      borderWidth: 1
    })
  }
  if (props.showPendiente) {
    datasets.push({
      label: props.labelPendiente,
      data: paginatedData.value.map(item => item.volumenPendiente),
      backgroundColor: 'rgba(245, 158, 11, 0.8)',
      borderColor: 'rgba(245, 158, 11, 1)',
      borderWidth: 1
    })
  }
  return {
    labels: paginatedData.value.map(item => item.contenedor),
    datasets
  }
})

function formatValue(value: number) {
  const text = value.toFixed(props.decimals)
  return props.unit ? `${text} ${props.unit}` : text
}

const chartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  resizeDelay: 0,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 20
      }
    },
    title: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          return `${context.dataset.label}: ${formatValue(context.parsed.y)}`
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        maxRotation: 45,
        minRotation: 0
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      },
      ticks: {
        callback: function(value) {
          const n = typeof value === 'number' ? value : Number(value)
          return formatValue(Number.isFinite(n) ? n : 0)
        }
      }
    }
  },
  interaction: {
    intersect: false,
    mode: 'index'
  },
  onClick: (_event, elements) => {
    if (!props.selectable || !elements.length) return
    const item = paginatedData.value[elements[0].index]
    if (item) emit('select', item.contenedor)
  }
}

const createChart = () => {
  if (!chartCanvas.value) return

  if (chartInstance) {
    chartInstance.destroy()
  }

  // Usar requestAnimationFrame para leer dimensiones y evitar forced reflow
  requestAnimationFrame(() => {
    if (!chartCanvas.value) return
    
    const container = chartCanvas.value.parentElement
    if (container) {
      chartCanvas.value.width = container.clientWidth
      chartCanvas.value.height = container.clientHeight
    }

    chartInstance = new ChartJS(chartCanvas.value, {
      type: 'bar',
      data: chartData.value,
      options: chartOptions
    })
  })
}

const updateChart = () => {
  if (chartInstance) {
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
  updateChart()
}, { deep: true })

watch(currentPage, () => {
  updateChart()
})

// ResizeObserver para manejar cambios de tamaño
let resizeObserver: ResizeObserver | null = null

// Lifecycle
onMounted(() => {
  createChart()
  
  // Observar cambios de tamaño del contenedor
  if (chartCanvas.value && chartCanvas.value.parentElement) {
    resizeObserver = new ResizeObserver(() => {
      if (chartInstance) {
        chartInstance.resize()
      }
    })
    resizeObserver.observe(chartCanvas.value.parentElement)
  }
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>
