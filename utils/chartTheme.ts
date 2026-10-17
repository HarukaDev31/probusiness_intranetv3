import type { Chart } from 'chart.js'

export function chartPalette() {
  const dark = import.meta.client && document.documentElement.classList.contains('dark')
  return {
    ink: dark ? '#f3f4f6' : '#1f2937',
    grid: dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'
  }
}

export function paintChartTheme(chart: Chart | null) {
  if (!chart) return
  const { ink, grid } = chartPalette()
  chart.options.color = ink
  const labels = chart.options.plugins?.legend?.labels
  if (labels) labels.color = ink
  const scales = chart.options.scales
  if (scales) {
    for (const scale of Object.values(scales)) {
      if (!scale) continue
      if (scale.ticks) scale.ticks.color = ink
      if ('title' in scale && scale.title) scale.title.color = ink
      if (scale.grid) scale.grid.color = grid
    }
  }
  chart.update()
}
