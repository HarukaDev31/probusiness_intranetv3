<template>
  <div class="space-y-5">
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article v-for="card in cards" :key="card.label" class="rounded-xl border border-default bg-default p-4">
        <p class="text-sm text-muted">{{ card.label }}</p>
        <p class="mt-2 text-3xl font-semibold tabular-nums" :class="tono(card.estado)">{{ card.valor }}</p>
        <div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span class="rounded-full px-2 py-0.5 font-medium" :class="chip(card.estado)">{{ card.etiqueta }}</span>
          <span class="text-muted">{{ card.detalle }}</span>
        </div>
      </article>
    </div>

    <section class="rounded-xl border border-default bg-default p-4">
      <h2 class="text-sm font-semibold">Alertas del mes</h2>
      <ul class="mt-3 space-y-2">
        <li
          v-for="(alerta, i) in data.resumen.alertas"
          :key="i"
          class="rounded-lg px-3 py-2 text-sm"
          :class="chip(alerta.nivel)"
        >
          {{ alerta.texto }}
        </li>
      </ul>
    </section>

    <div class="grid gap-4 xl:grid-cols-5">
      <section class="rounded-xl border border-default bg-default p-4 xl:col-span-3">
        <h2 class="text-sm font-semibold">Solicitudes por área</h2>
        <p class="mt-1 text-xs text-muted">Clic en una barra para ver solo esa área.</p>
        <div class="mt-3 h-80">
          <VolumeBarChart
            v-if="areasChart.length"
            :data="areasChart"
            :items-per-page="6"
            unit=""
            :decimals="0"
            item-noun="áreas"
            label-china="Requerimientos"
            label-vendido="Proyectos"
            :show-pendiente="false"
            selectable
            @select="$emit('filtrar-area', $event)"
          />
          <p v-else class="flex h-full items-center justify-center text-sm text-muted">No hay solicitudes este mes.</p>
        </div>
      </section>

      <section class="rounded-xl border border-default bg-default p-4 xl:col-span-2">
        <h2 class="text-sm font-semibold">Proyectos y requerimientos</h2>
        <div class="mt-3 h-64">
          <SalesPieChart
            v-if="pieChart.some((item) => item.volumenVendido > 0)"
            :data="pieChart"
            :height="256"
            unit=""
            :decimals="0"
          />
          <p v-else class="flex h-full items-center justify-center text-sm text-muted">Sin solicitudes este mes.</p>
        </div>
      </section>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <section class="rounded-xl border border-default bg-default p-4">
        <h2 class="text-sm font-semibold">Solicitudes por mes</h2>
        <div class="mt-3 h-72">
          <VolumeBarChart
            :data="totalesMes"
            :items-per-page="6"
            unit=""
            :decimals="0"
            item-noun="meses"
            label-china="Solicitudes"
            :show-vendido="false"
            :show-pendiente="false"
          />
        </div>
      </section>
      <section class="rounded-xl border border-default bg-default p-4">
        <h2 class="text-sm font-semibold">Cumplimiento de SLA</h2>
        <div class="mt-3 h-72">
          <DailyProgressChart :data="lineaSla" :height="288" :days-per-page="6" x-axis-title="Mes" y-axis-title="%" :show-right-axis="false" />
        </div>
      </section>
      <section class="rounded-xl border border-default bg-default p-4">
        <h2 class="text-sm font-semibold">Solicitudes vencidas</h2>
        <div class="mt-3 h-72">
          <VolumeBarChart
            :data="vencidasMes"
            :items-per-page="6"
            unit=""
            :decimals="0"
            item-noun="meses"
            label-china="Vencidas"
            :show-vendido="false"
            :show-pendiente="false"
          />
        </div>
      </section>
      <section class="rounded-xl border border-default bg-default p-4">
        <h2 class="text-sm font-semibold">Tasa de cierre</h2>
        <div class="mt-3 h-72">
          <DailyProgressChart :data="lineaCierre" :height="288" :days-per-page="6" x-axis-title="Mes" y-axis-title="%" :show-right-axis="false" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import type { SoporteTiIndicadorEstado, SoporteTiIndicadores } from '~/types/soporteTiIndicadores'
import SoporteTiChartSkeleton from '~/components/soporte-ti/SoporteTiChartSkeleton.vue'

const graficoAsync = { loadingComponent: SoporteTiChartSkeleton, delay: 0, suspensible: false }
const VolumeBarChart = defineAsyncComponent({
  loader: () => import('~/components/charts/VolumeBarChart.vue'),
  ...graficoAsync
})
const SalesPieChart = defineAsyncComponent({
  loader: () => import('~/components/charts/SalesPieChart.vue'),
  ...graficoAsync
})
const DailyProgressChart = defineAsyncComponent({
  loader: () => import('~/components/charts/DailyProgressChart.vue'),
  ...graficoAsync
})

const props = defineProps<{ data: SoporteTiIndicadores }>()
defineEmits<{ 'filtrar-area': [area: string] }>()

const areasChart = computed(() =>
  props.data.por_area.map((area) => ({
    contenedor: area.nombre,
    volumenChina: area.tipo_b,
    volumenVendido: area.tipo_a,
    volumenPendiente: 0
  }))
)

const pieChart = computed(() => [
  {
    vendedor: 'Proyectos',
    volumenTotal: props.data.comparacion.proyectos.total,
    volumenVendido: props.data.comparacion.proyectos.total,
    volumenPendiente: 0
  },
  {
    vendedor: 'Requerimientos',
    volumenTotal: props.data.comparacion.requerimientos.total,
    volumenVendido: props.data.comparacion.requerimientos.total,
    volumenPendiente: 0
  }
])

const totalesMes = computed(() =>
  props.data.evolucion.map((punto) => ({
    contenedor: punto.label,
    volumenChina: punto.total,
    volumenVendido: 0,
    volumenPendiente: 0
  }))
)

const vencidasMes = computed(() =>
  props.data.evolucion.map((punto) => ({
    contenedor: punto.label,
    volumenChina: punto.vencidas,
    volumenVendido: 0,
    volumenPendiente: 0
  }))
)

function linea(label: string, values: Array<number | null>, color: string) {
  return {
    labels: props.data.evolucion.map((punto) => punto.label),
    datasets: [
      {
        label,
        data: values,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 2,
        fill: false,
        tension: 0.3
      }
    ]
  }
}

const lineaSla = computed(() => linea('% SLA', props.data.evolucion.map((punto) => punto.sla_pct), 'rgba(16, 185, 129, 1)'))
const lineaCierre = computed(() => linea('% cierre', props.data.evolucion.map((punto) => punto.cierre_pct), 'rgba(59, 130, 246, 1)'))

const cards = computed(() => {
  const r = props.data.resumen
  return [
    {
      label: 'Solicitudes del mes',
      valor: String(r.total),
      estado: r.total_estado,
      etiqueta: r.total_etiqueta,
      detalle: r.total_detalle
    },
    {
      label: 'Cumplimiento de SLA',
      valor: r.sla_pct == null ? '—' : `${r.sla_pct}%`,
      estado: r.sla_estado,
      etiqueta: etiqueta(r.sla_estado),
      detalle: r.sla_resueltas ? `${r.sla_resueltas} resueltas con plazo` : 'Sin resueltas con plazo'
    },
    {
      label: 'Vencidas',
      valor: String(r.vencidas),
      estado: r.vencidas_estado,
      etiqueta: etiqueta(r.vencidas_estado),
      detalle: r.abiertas ? `${r.vencidas_pct}% de ${r.abiertas} en progreso o hecho` : 'Sin solicitudes en progreso o hecho'
    },
    {
      label: 'Tasa de cierre',
      valor: r.cierre_pct == null ? '—' : `${r.cierre_pct}%`,
      estado: r.cierre_estado,
      etiqueta: etiqueta(r.cierre_estado),
      detalle: r.cierre_total ? `${r.cierre_operativas} de ${r.cierre_total} completadas` : 'Sin solicitudes'
    }
  ]
})

function etiqueta(estado: SoporteTiIndicadorEstado) {
  if (estado === 'green') return 'Cumple'
  if (estado === 'amber') return 'Atención'
  if (estado === 'red') return 'Crítico'
  return 'Sin datos'
}

function tono(estado: SoporteTiIndicadorEstado) {
  if (estado === 'green') return 'text-emerald-700 dark:text-emerald-300'
  if (estado === 'amber') return 'text-amber-700 dark:text-amber-300'
  if (estado === 'red') return 'text-red-700 dark:text-red-300'
  return 'text-highlighted'
}

function chip(estado: SoporteTiIndicadorEstado) {
  if (estado === 'green') return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
  if (estado === 'amber') return 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
  if (estado === 'red') return 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200'
  return 'bg-elevated text-muted'
}
</script>
