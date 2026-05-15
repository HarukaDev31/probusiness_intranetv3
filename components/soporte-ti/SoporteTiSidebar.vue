<template>
  <div class="flex w-52 shrink-0 flex-col bg-slate-900">
    <div class="border-b border-slate-700/60 px-4 py-4">
      <div class="text-[14px] font-semibold tracking-tight text-white">Soporte TI</div>
      <div class="mt-0.5 text-[10px] text-slate-500">Sistema de gestión</div>
    </div>
    <div class="border-b border-slate-700/60 px-4 py-3">
      <p class="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-slate-500">
        Rol activo
      </p>
      <select
        class="w-full cursor-pointer rounded-md border border-slate-600 bg-slate-800 px-2 py-1.5 text-[12px] text-slate-300 focus:outline-none"
        :value="rol"
        @change="onRol(($event.target as HTMLSelectElement).value as SoporteTiRol)"
      >
        <option v-for="r in SOPORTE_TI_ROLES" :key="r" :value="r">{{ r }}</option>
      </select>
    </div>
    <div class="flex-1 py-3">
      <p class="mb-1 px-4 text-[9px] font-semibold uppercase tracking-widest text-slate-500">
        Módulo
      </p>
      <div
        class="flex items-center gap-2 border-l-2 border-blue-500 bg-slate-800 px-4 py-2 text-[12px] text-white"
      >
        <UIcon name="i-heroicons-clipboard-document-list" class="size-4 text-slate-400" />
        Solicitudes
      </div>
    </div>
    <div class="flex items-center gap-2 border-t border-slate-700/60 px-4 py-3">
      <div
        class="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
        :style="{ background: meta.color }"
      >
        {{ meta.iniciales }}
      </div>
      <div>
        <div class="text-[11px] font-medium text-slate-300">{{ meta.nombre }}</div>
        <div class="text-[10px] text-slate-500">{{ rol }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SOPORTE_TI_ROL_META, SOPORTE_TI_ROLES, type SoporteTiRol } from '~/constants/soporteTi'

const props = defineProps<{ rol: SoporteTiRol }>()

const emit = defineEmits<{
  'update:rol': [r: SoporteTiRol]
}>()

const meta = computed(() => SOPORTE_TI_ROL_META[props.rol])

function onRol(v: SoporteTiRol) {
  emit('update:rol', v)
}
</script>
