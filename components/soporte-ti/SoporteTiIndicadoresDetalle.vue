<template>
  <div class="space-y-6">
    <section class="rounded-xl border border-default bg-default p-4">
      <h2 class="text-sm font-semibold">Solicitudes por tipo</h2>
      <div class="mt-3 h-64">
        <SalesPieChart :data="pieTipo" :height="256" unit="" :decimals="0" />
      </div>
    </section>

    <section v-for="bloque in bloques" :key="bloque.titulo" class="space-y-4">
      <h2 class="text-base font-semibold">{{ bloque.titulo }}</h2>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article v-for="card in bloque.cards" :key="card.label" class="rounded-xl border border-default bg-default p-4">
          <p class="text-sm text-muted">{{ card.label }}</p>
          <p class="mt-1 text-2xl font-semibold tabular-nums">{{ card.valor }}</p>
          <p class="mt-1 text-xs text-muted">{{ card.detalle }}</p>
        </article>
      </div>
      <div class="grid gap-4 xl:grid-cols-2">
        <div class="rounded-xl border border-default bg-default p-4">
          <h3 class="text-sm font-semibold">Por estado</h3>
          <div class="mt-3 h-72">
            <VolumeBarChart
              :data="bloque.estados"
              :items-per-page="6"
              unit=""
              :decimals="0"
              item-noun="estados"
              label-china="Solicitudes"
              :show-vendido="false"
              :show-pendiente="false"
            />
          </div>
        </div>
        <div class="overflow-x-auto rounded-xl border border-default bg-default p-4">
          <h3 class="text-sm font-semibold">Por complejidad</h3>
          <table class="mt-3 w-full min-w-[520px] text-sm">
            <thead>
              <tr class="border-b border-default text-left text-xs text-muted">
                <th class="py-2 pr-2">Nivel</th>
                <th class="py-2 pr-2 text-right">Resueltas</th>
                <th class="py-2 pr-2 text-right">A tiempo</th>
                <th class="py-2 pr-2 text-right">SLA</th>
                <th class="py-2 text-right">Tiempo prom.</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="nivel in bloque.niveles" :key="nivel.nivel" class="border-b border-default last:border-0">
                <td class="py-2 pr-2 font-medium">{{ nivel.nivel }}</td>
                <td class="py-2 pr-2 text-right tabular-nums">{{ nivel.con_plazo }}</td>
                <td class="py-2 pr-2 text-right tabular-nums">{{ nivel.cumplidos }}</td>
                <td class="py-2 pr-2 text-right tabular-nums">{{ pct(nivel.pct) }}</td>
                <td class="py-2 text-right tabular-nums">{{ horas(nivel.promedio_horas) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="rounded-xl border border-default bg-default p-4">
      <h2 class="text-sm font-semibold">Requieren atención</h2>
      <p class="mt-1 text-xs text-muted">
        Solicitudes con el reloj en marcha que ya consumieron el 75% o más de su plazo.
      </p>
      <div v-if="atencion.length" class="mt-3 overflow-x-auto">
        <table class="w-full min-w-[720px] text-sm">
          <thead>
            <tr class="border-b border-default text-left text-xs text-muted">
              <th class="py-2 pr-3">Código</th>
              <th class="py-2 pr-3">Solicitud</th>
              <th class="py-2 pr-3">Tipo</th>
              <th class="py-2 pr-3">Prioridad</th>
              <th class="py-2 pr-3">Complejidad</th>
              <th class="py-2 pr-3 text-right">SLA usado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in atencion" :key="item.id" class="border-b border-default last:border-0">
              <td class="py-2 pr-3 font-medium">{{ item.codigo }}</td>
              <td class="py-2 pr-3">
                <p>{{ item.titulo }}</p>
                <p class="text-xs text-muted">{{ item.area }} · {{ item.estado }}</p>
              </td>
              <td class="py-2 pr-3">{{ item.tipo === 'A' ? 'Proyecto' : 'Requerimiento' }}</td>
              <td class="py-2 pr-3">{{ item.prioridad }}</td>
              <td class="py-2 pr-3">{{ item.complejidad }}</td>
              <td class="py-2 text-right font-semibold tabular-nums" :class="item.zona === 'red' ? 'text-red-700' : 'text-amber-700'">
                {{ item.pct }}%
                <span v-if="item.atraso" class="ml-1 text-xs font-medium">{{ item.atraso }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="mt-4 text-sm text-muted">Ninguna solicitud activa está por vencer o vencida.</p>
    </section>

    <section class="rounded-xl border border-default bg-default p-4">
      <h2 class="text-sm font-semibold">Resumen de los últimos meses</h2>
      <p class="mt-1 text-xs text-muted">Barras: solicitudes y vencidas. Líneas: SLA y cierre.</p>
      <SoporteTiIndicadoresMensualChart v-if="mensual.length" class="mt-3" :filas="mensual" />
      <p v-else class="mt-4 text-sm text-muted">No hay meses para mostrar.</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import type { SoporteTiIndicadorBloqueTipo, SoporteTiIndicadores } from '~/types/soporteTiIndicadores'
import SoporteTiChartSkeleton from '~/components/soporte-ti/SoporteTiChartSkeleton.vue'

const graficoAsync = { loadingComponent: SoporteTiChartSkeleton, delay: 0, suspensible: false }
const SalesPieChart = defineAsyncComponent({
  loader: () => import('~/components/charts/SalesPieChart.vue'),
  ...graficoAsync
})
const VolumeBarChart = defineAsyncComponent({
  loader: () => import('~/components/charts/VolumeBarChart.vue'),
  ...graficoAsync
})
const SoporteTiIndicadoresMensualChart = defineAsyncComponent({
  loader: () => import('~/components/soporte-ti/SoporteTiIndicadoresMensualChart.vue'),
  ...graficoAsync
})

const props = defineProps<{ data: SoporteTiIndicadores }>()

const pieTipo = computed(() =>
  props.data.detalle.por_tipo.map((tipo) => ({
    vendedor: tipo.nombre,
    volumenTotal: tipo.total,
    volumenVendido: tipo.total,
    volumenPendiente: 0
  }))
)

const atencion = computed(() => props.data.detalle.atencion || [])
const mensual = computed(() => props.data.detalle.mensual || [])

const bloques = computed(() => [
  armar('Proyectos', props.data.detalle.tipo_a, 'En curso'),
  armar('Requerimientos TI', props.data.detalle.tipo_b, 'En atención')
])

function armar(titulo: string, bloque: SoporteTiIndicadorBloqueTipo, enCurso: string) {
  return {
    titulo,
    niveles: bloque.niveles,
    estados: bloque.por_estado.map((estado) => ({
      contenedor: estado.nombre,
      volumenChina: estado.total,
      volumenVendido: 0,
      volumenPendiente: 0
    })),
    cards: [
      {
        label: 'SLA',
        valor: bloque.sla_pct == null ? '—' : `${bloque.sla_pct}%`,
        detalle: `${bloque.sla_resueltas} resueltas`
      },
      {
        label: 'Vencidas',
        valor: String(bloque.vencidas),
        detalle: bloque.abiertas ? `${bloque.vencidas_pct}% de ${bloque.abiertas} en progreso o hecho` : 'Sin solicitudes en progreso o hecho'
      },
      {
        label: 'Cierre',
        valor: bloque.cierre_pct == null ? '—' : `${bloque.cierre_pct}%`,
        detalle: `${bloque.operativas} completadas`
      },
      {
        label: enCurso,
        valor: String(bloque.en_curso),
        detalle: `${bloque.pendientes} pendientes`
      }
    ]
  }
}

function pct(value: number | null) {
  return value == null ? '—' : `${value}%`
}

function horas(value: number | null) {
  return value == null ? '—' : `${value} h`
}
</script>
