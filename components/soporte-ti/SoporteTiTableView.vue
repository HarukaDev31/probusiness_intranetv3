<template>
  <div class="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
      <div class="flex flex-wrap items-center gap-2">
        <div class="relative">
          <UIcon
            name="i-heroicons-magnifying-glass"
            class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
          />
          <input
            v-model="q"
            type="search"
            class="w-48 rounded-lg border border-slate-300 bg-slate-50 py-1.5 pl-8 pr-3 text-[12px] focus:border-blue-400 focus:bg-white focus:outline-none"
            placeholder="Buscar..."
          >
        </div>
        <select
          v-model="filtroTipo"
          class="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px]"
        >
          <option value="todos">Todos</option>
          <option value="A">Tipo A</option>
          <option value="B">Tipo B</option>
        </select>
      </div>
      <div class="flex rounded-md bg-slate-100 p-0.5">
        <button
          type="button"
          class="rounded px-3 py-1 text-[11px]"
          :class="vista === 'tabla' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500'"
          @click="vista = 'tabla'"
        >
          Tabla
        </button>
        <button
          type="button"
          class="rounded px-3 py-1 text-[11px]"
          :class="vista === 'kanban' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500'"
          @click="vista = 'kanban'"
        >
          Kanban
        </button>
      </div>
    </div>

    <table v-if="vista === 'tabla'" class="w-full">
      <thead>
        <tr class="border-b border-slate-200 bg-slate-50">
          <th class="w-20 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Código
          </th>
          <th class="w-14 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Tipo
          </th>
          <th class="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Título
          </th>
          <th class="w-24 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Área
          </th>
          <th class="w-20 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Registro
          </th>
          <th class="w-[170px] px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Avance
          </th>
          <th class="w-10 px-3 py-2.5" />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="t in filtradas"
          :key="t.codigo"
          class="cursor-pointer border-b border-slate-100 transition hover:bg-blue-50/40"
          @click="emit('select', t)"
        >
          <td class="px-3 py-2.5 font-mono text-[11px] text-slate-500">{{ t.codigo }}</td>
          <td class="px-3 py-2.5">
            <SoporteTiBadge :etiqueta="t.tipo === 'A' ? 'A' : (t.subtipoB || 'B')" />
          </td>
          <td class="max-w-[200px] truncate px-3 py-2.5 text-[12px] font-medium text-slate-800">
            {{ t.titulo }}
          </td>
          <td class="px-3 py-2.5 text-[12px] text-slate-500">{{ t.area }}</td>
          <td class="px-3 py-2.5 text-[11px] text-slate-400">{{ t.fechaRegistro }}</td>
          <td class="px-3 py-2.5">
            <SoporteTiProgressStepper :solicitud="t" />
          </td>
          <td class="px-3 py-2.5">
            <span class="text-[11px] font-medium text-blue-600">→</span>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else class="overflow-x-auto p-4">
      <div class="flex gap-3" style="min-width: max-content">
        <div v-for="col in columnasKanban" :key="col" class="w-52 shrink-0">
          <div class="mb-2 flex items-center justify-between rounded-t-lg px-2.5 py-1.5">
            <SoporteTiBadge :etiqueta="col" />
            <span class="text-[10px] font-medium text-slate-400">{{ tarjetasPorColumna(col).length }}</span>
          </div>
          <div
            v-for="t in tarjetasPorColumna(col)"
            :key="t.codigo"
            class="mb-2 cursor-pointer rounded-lg border border-slate-200 bg-white p-2.5 transition hover:-translate-y-px hover:border-blue-300"
            @click="emit('select', t)"
          >
            <div class="mb-1 flex items-center justify-between">
              <span class="font-mono text-[9px] text-slate-400">{{ t.codigo }}</span>
              <SoporteTiBadge :etiqueta="t.tipo === 'A' ? 'A' : (t.subtipoB || 'B')" />
            </div>
            <div class="mb-2 text-[11px] font-medium leading-snug text-slate-800">{{ t.titulo }}</div>
            <SoporteTiProgressStepper :solicitud="t" tam="sm" />
            <div class="mt-2 flex items-center justify-between text-[9px] text-slate-400">
              <span>{{ t.area }}</span>
              <span>{{ t.fechaRegistro }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { SOPORTE_TI_KANBAN_COLUMNAS } from '~/constants/soporteTi'
import type { SoporteTiSolicitud } from '~/types/soporteTi'
import SoporteTiBadge from '~/components/soporte-ti/SoporteTiBadge.vue'
import SoporteTiProgressStepper from '~/components/soporte-ti/SoporteTiProgressStepper.vue'

const props = defineProps<{ solicitudes: SoporteTiSolicitud[] }>()

const emit = defineEmits<{
  select: [s: SoporteTiSolicitud]
}>()

const q = ref('')
const filtroTipo = ref<'todos' | 'A' | 'B'>('todos')
const vista = ref<'tabla' | 'kanban'>('tabla')

const columnasKanban = SOPORTE_TI_KANBAN_COLUMNAS

const filtradas = computed(() =>
  props.solicitudes.filter((t) => {
    const matchQ =
      !q.value ||
      t.titulo.toLowerCase().includes(q.value.toLowerCase()) ||
      t.codigo.toLowerCase().includes(q.value.toLowerCase())
    const matchT =
      filtroTipo.value === 'todos' ||
      (filtroTipo.value === 'A' && t.tipo === 'A') ||
      (filtroTipo.value === 'B' && t.tipo === 'B')
    return matchQ && matchT
  })
)

function tarjetasPorColumna(col: string) {
  return filtradas.value.filter((t) => t.estado === col)
}
</script>
