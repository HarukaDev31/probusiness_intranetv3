<template>
  <div class="space-y-6">
    <section class="rounded-xl border border-default bg-default p-4">
      <h2 class="text-sm font-semibold">En progreso y Hecho</h2>
      <p class="mt-1 text-xs text-muted">
        Tiempo del horario laboral y el plazo guardado en cada solicitud. Vencida solo si está en uno de estos estados y ya superó su plazo.
      </p>
      <div v-if="tiempos.length" class="mt-3 space-y-3 overflow-x-auto">
        <table class="w-full min-w-[820px] text-sm">
          <thead>
            <tr class="border-b border-default text-left text-xs text-muted">
              <th class="py-2 pr-3">Código</th>
              <th class="py-2 pr-3">Solicitud</th>
              <th class="py-2 pr-3">Estado</th>
              <th class="py-2 pr-3">Complejidad</th>
              <th class="py-2 pr-3 text-right">Tiempo</th>
              <th class="py-2 pr-3 text-right">Plazo</th>
              <th class="py-2">Resultado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in tiempos" :key="item.id" class="border-b border-default last:border-0">
              <td class="py-2 pr-3 font-medium">{{ item.codigo }}</td>
              <td class="py-2 pr-3">
                <p>{{ item.titulo }}</p>
                <p class="text-xs text-muted">{{ item.area }}</p>
              </td>
              <td class="py-2 pr-3">{{ item.estado }}</td>
              <td class="py-2 pr-3">{{ item.complejidad }}</td>
              <td class="py-2 pr-3 text-right tabular-nums">{{ horas(item.horas) }}</td>
              <td class="py-2 pr-3 text-right tabular-nums">{{ plazo(item.sla_horas) }}</td>
              <td class="py-2">
                <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="chip(item)">
                  {{ etiqueta(item) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="paginacionTiempos.total > paginacionTiempos.per_page" class="flex justify-end">
          <UPagination
            :model-value="paginacionTiempos.page"
            :total="paginacionTiempos.total"
            :items-per-page="paginacionTiempos.per_page"
            @update:page="emit('pagina', $event)"
          />
        </div>
      </div>
      <p v-else class="mt-4 text-sm text-muted">No hay solicitudes en progreso o hecho en este mes.</p>
    </section>

    <section class="rounded-xl border border-default bg-default p-4">
      <h2 class="text-sm font-semibold">Finalización</h2>
      <p class="mt-1 text-xs text-muted">
        Fecha en que quedaron Desplegadas u Operativas. El plazo es el que tenía cada solicitud: si pasó de 3 h a 2 h, las anteriores siguen en 3 h.
      </p>
      <div v-if="finalizadas.length" class="mt-3 space-y-3 overflow-x-auto">
        <table class="w-full min-w-[860px] text-sm">
          <thead>
            <tr class="border-b border-default text-left text-xs text-muted">
              <th class="py-2 pr-3">Código</th>
              <th class="py-2 pr-3">Solicitud</th>
              <th class="py-2 pr-3">Complejidad</th>
              <th class="py-2 pr-3">Finalizó</th>
              <th class="py-2 pr-3 text-right">Tiempo</th>
              <th class="py-2 pr-3 text-right">Plazo</th>
              <th class="py-2">Resultado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in finalizadas" :key="item.id" class="border-b border-default last:border-0">
              <td class="py-2 pr-3 font-medium">{{ item.codigo }}</td>
              <td class="py-2 pr-3">
                <p>{{ item.titulo }}</p>
                <p class="text-xs text-muted">{{ item.area }} · {{ item.estado }}</p>
              </td>
              <td class="py-2 pr-3">{{ item.complejidad }}</td>
              <td class="py-2 pr-3 tabular-nums">{{ item.finalizado_en }}</td>
              <td class="py-2 pr-3 text-right tabular-nums">{{ horas(item.horas) }}</td>
              <td class="py-2 pr-3 text-right tabular-nums">{{ plazo(item.sla_horas) }}</td>
              <td class="py-2">
                <span
                  class="rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="item.a_tiempo ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'"
                >
                  {{ item.sla_horas > 0 ? (item.a_tiempo ? 'A tiempo' : 'Fuera de plazo') : 'Sin plazo' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="paginacionFinalizadas.total > paginacionFinalizadas.per_page" class="flex justify-end">
          <UPagination
            :model-value="paginacionFinalizadas.page"
            :total="paginacionFinalizadas.total"
            :items-per-page="paginacionFinalizadas.per_page"
            @update:page="emit('pagina-fin', $event)"
          />
        </div>
      </div>
      <p v-else class="mt-4 text-sm text-muted">Ninguna solicitud se finalizó en este mes.</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  SoporteTiIndicadorPaginacion,
  SoporteTiIndicadorTiempo,
  SoporteTiIndicadores
} from '~/types/soporteTiIndicadores'

const props = defineProps<{ data: SoporteTiIndicadores }>()
const emit = defineEmits<{ pagina: [page: number]; 'pagina-fin': [page: number] }>()

const vacia: SoporteTiIndicadorPaginacion = { page: 1, per_page: 15, total: 0, last_page: 1 }

const tiempos = computed(() => props.data.detalle.tiempos || [])
const finalizadas = computed(() => props.data.detalle.finalizadas || [])
const paginacionTiempos = computed(() => props.data.detalle.tiempos_paginacion || vacia)
const paginacionFinalizadas = computed(() => props.data.detalle.finalizadas_paginacion || vacia)

function horas(value: number) {
  return `${value} h`
}

function plazo(value: number) {
  return value > 0 ? `${value} h` : '—'
}

function etiqueta(item: SoporteTiIndicadorTiempo) {
  if (item.sla_horas <= 0) return 'Sin plazo'
  return item.vencida ? 'Vencida' : 'En plazo'
}

function chip(item: SoporteTiIndicadorTiempo) {
  if (item.sla_horas <= 0) return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
  if (item.vencida) return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
  return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
}
</script>
