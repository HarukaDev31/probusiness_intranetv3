import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  ArcElement,
  DoughnutController,
  PieController,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

export default defineNuxtPlugin(() => {
  // Registrar todos los componentes de Chart.js que necesitamos
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    BarController,
    ArcElement,
    DoughnutController,
    PieController,
    Title,
    Tooltip,
    Legend
  )
  
  // Configuración global de Chart.js
  ChartJS.defaults.font.family = 'Inter, system-ui, sans-serif'
  ChartJS.defaults.color = '#6B7280'
  ChartJS.defaults.borderColor = 'rgba(0, 0, 0, 0.1)'
  
  // Configuración responsive por defecto
  ChartJS.defaults.responsive = true
  ChartJS.defaults.maintainAspectRatio = false
})
