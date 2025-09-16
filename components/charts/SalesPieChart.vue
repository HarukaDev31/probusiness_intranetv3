<template>
  <div class="relative">
    <canvas ref="chartCanvas" :width="width" :height="height"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import {
  Chart as ChartJS,
  ArcElement,
  DoughnutController,
  PieController,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData
} from 'chart.js'

// Registrar componentes de Chart.js
ChartJS.register(
  ArcElement, 
  DoughnutController,
  PieController,
  Tooltip, 
  Legend
)

interface SalesData {
  vendedor: string
  volumenTotal: number
  volumenVendido: number
  volumenPendiente: number
}

interface Props {
  data: SalesData[]
  width?: number
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: 400,
  height: 200
})

const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: ChartJS | null = null

// Colores para el gráfico
const colors = [
  'rgba(59, 130, 246, 0.8)',   // Azul
  'rgba(16, 185, 129, 0.8)',   // Verde
  'rgba(245, 158, 11, 0.8)',   // Amarillo
  'rgba(239, 68, 68, 0.8)',    // Rojo
  'rgba(139, 92, 246, 0.8)',   // Púrpura
  'rgba(236, 72, 153, 0.8)',   // Rosa
  'rgba(14, 165, 233, 0.8)',   // Azul claro
  'rgba(34, 197, 94, 0.8)',    // Verde claro
]

const borderColors = [
  'rgba(59, 130, 246, 1)',
  'rgba(16, 185, 129, 1)',
  'rgba(245, 158, 11, 1)',
  'rgba(239, 68, 68, 1)',
  'rgba(139, 92, 246, 1)',
  'rgba(236, 72, 153, 1)',
  'rgba(14, 165, 233, 1)',
  'rgba(34, 197, 94, 1)',
]

const chartData = computed((): ChartData<'pie'> => ({
  labels: props.data.map(item => item.vendedor),
  datasets: [
    {
      label: 'Volumen Vendido',
      data: props.data.map(item => item.volumenVendido),
      backgroundColor: colors.slice(0, props.data.length),
      borderColor: borderColors.slice(0, props.data.length),
      borderWidth: 2
    }
  ]
}))

const chartOptions: ChartOptions<'pie'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        usePointStyle: true,
        padding: 15,
        generateLabels: function(chart) {
          const data = chart.data
          if (data.labels && data.datasets.length) {
            return data.labels.map((label, i) => {
              const dataset = data.datasets[0]
              const value = dataset.data[i] as number
              const total = (dataset.data as number[]).reduce((a, b) => a + b, 0)
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
              
              return {
                text: `${label} (${percentage}%)`,
                fillStyle: dataset.backgroundColor?.[i] as string,
                strokeStyle: dataset.borderColor?.[i] as string,
                lineWidth: dataset.borderWidth as number,
                hidden: false,
                index: i,
                pointStyle: 'circle'
              }
            })
          }
          return []
        }
      }
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const label = context.label || ''
          const value = context.parsed
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
          return `${label}: ${value.toFixed(2)} m³ (${percentage}%)`
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
    type: 'pie',
    data: chartData.value,
    options: chartOptions
  })
}

const updateChart = () => {
  if (chartInstance) {
    chartInstance.data = chartData.value
    chartInstance.update('none')
  }
}

// Watchers
watch(() => props.data, () => {
  updateChart()
}, { deep: true })

// Lifecycle
onMounted(() => {
  createChart()
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})
</script>
