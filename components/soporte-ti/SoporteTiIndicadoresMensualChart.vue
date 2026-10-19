<template>
  <div class="relative h-80">
    <canvas ref="canvas" class="h-full w-full"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  PointElement,
  LineController,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions
} from 'chart.js'
import { paintChartTheme } from '~/utils/chartTheme'
import type { SoporteTiIndicadorEvolucion } from '~/types/soporteTiIndicadores'

const props = defineProps<{ filas: SoporteTiIndicadorEvolucion[] }>()

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  PointElement,
  LineController,
  Tooltip,
  Legend
)

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: ChartJS | null = null
let resizeObserver: ResizeObserver | null = null

function buildData(): ChartData {
  return {
    labels: props.filas.map((fila) => fila.label),
    datasets: [
      {
        type: 'bar',
        label: 'Solicitudes',
        data: props.filas.map((fila) => fila.total),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        yAxisID: 'y',
        order: 2
      },
      {
        type: 'bar',
        label: 'Vencidas',
        data: props.filas.map((fila) => fila.vencidas),
        backgroundColor: 'rgba(239, 68, 68, 0.85)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
        yAxisID: 'y',
        order: 2
      },
      {
        type: 'line',
        label: 'SLA',
        data: props.filas.map((fila) => fila.sla_pct),
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        tension: 0.3,
        spanGaps: false,
        pointRadius: 3,
        yAxisID: 'y1',
        order: 1
      },
      {
        type: 'line',
        label: 'Cierre',
        data: props.filas.map((fila) => fila.cierre_pct),
        borderColor: 'rgba(245, 158, 11, 1)',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        tension: 0.3,
        spanGaps: false,
        pointRadius: 3,
        yAxisID: 'y1',
        order: 1
      }
    ]
  }
}

const options: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'top',
      labels: { usePointStyle: true, padding: 16 }
    },
    tooltip: {
      callbacks: {
        label(context) {
          const value = context.parsed.y
          if (value == null) return `${context.dataset.label}: —`
          if (context.dataset.yAxisID === 'y1') return `${context.dataset.label}: ${value}%`
          return `${context.dataset.label}: ${value}`
        }
      }
    }
  },
  scales: {
    x: { grid: { display: false } },
    y: {
      beginAtZero: true,
      position: 'left',
      title: { display: true, text: 'Solicitudes' },
      ticks: { precision: 0 }
    },
    y1: {
      beginAtZero: true,
      max: 100,
      position: 'right',
      title: { display: true, text: 'Porcentaje' },
      grid: { drawOnChartArea: false },
      ticks: {
        callback(value) {
          return `${value}%`
        }
      }
    }
  }
}

function createChart() {
  if (!canvas.value) return
  chart?.destroy()
  requestAnimationFrame(() => {
    if (!canvas.value) return
    chart = new ChartJS(canvas.value, {
      type: 'bar',
      data: buildData(),
      options
    })
    paintChartTheme(chart)
  })
}

function updateChart() {
  if (!chart) return
  chart.data = buildData()
  chart.update('none')
}

const colorMode = useColorMode()
watch(() => colorMode.value, () => paintChartTheme(chart))
watch(() => props.filas, updateChart, { deep: true })

onMounted(() => {
  createChart()
  const parent = canvas.value?.parentElement
  if (!parent) return
  resizeObserver = new ResizeObserver(() => chart?.resize())
  resizeObserver.observe(parent)
})

onUnmounted(() => {
  chart?.destroy()
  resizeObserver?.disconnect()
})
</script>
