<template>
  <div
    class="mb-4 overflow-hidden rounded-xl border-2"
    :class="pendiente ? 'border-violet-400' : 'border-green-300'"
  >
    <div
      class="flex items-center justify-between border-b px-4 py-3"
      :class="
        pendiente
          ? 'border-violet-200 bg-violet-50'
          : 'border-green-200 bg-green-50'
      "
    >
      <div class="flex items-center gap-2">
        <span
          class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
          :class="
            pendiente ? 'bg-violet-100 text-violet-700' : 'bg-green-100 text-green-700'
          "
        >
          {{ pendiente ? 'Pendiente de revisión' : 'Aprobada' }}
        </span>
        <span class="text-[13px] font-semibold text-slate-800">Maqueta entregada</span>
      </div>
      <span class="text-[10px] text-slate-500">{{ maqueta.fechaEntrega }}</span>
    </div>
    <div
      class="flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-violet-50 via-violet-100 to-purple-50 py-10"
    >
      <img
        v-if="maqueta.dataUrl"
        :src="maqueta.dataUrl"
        alt="Maqueta"
        class="max-h-48 rounded-lg shadow-sm"
      >
      <template v-else>
        <UIcon name="i-heroicons-squares-2x2" class="size-10 text-violet-400" />
        <span class="text-[12px] font-medium text-violet-600">{{ maqueta.nombre }}</span>
      </template>
    </div>
    <div
      class="flex items-center gap-2 border-t px-4 py-3"
      :class="pendiente ? 'border-violet-200' : 'border-green-200'"
    >
      <span class="flex-1 text-[11px] text-slate-500">
        {{ maqueta.nombre }} · {{ maqueta.tamano }}
      </span>
      <template v-if="rol === 'Solicitante' && pendiente">
        <UButton size="xs" color="error" variant="outline" icon="i-heroicons-x-mark" @click="emit('reject')">
          Rechazar
        </UButton>
        <UButton
          size="xs"
          color="success"
          variant="outline"
          icon="i-heroicons-check"
          @click="emit('approve')"
        >
          Aprobar maqueta
        </UButton>
      </template>
      <span
        v-if="maqueta.aprobada"
        class="flex items-center gap-1 text-[11px] font-medium text-green-600"
      >
        <UIcon name="i-heroicons-check-circle" class="size-3.5" />
        Aprobada
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SoporteTiMaqueta } from '~/types/soporteTi'
import type { SoporteTiRol } from '~/constants/soporteTi'

const props = defineProps<{
  maqueta: SoporteTiMaqueta
  rol: SoporteTiRol
}>()

const emit = defineEmits<{
  approve: []
  reject: []
}>()

const pendiente = computed(() => !props.maqueta.aprobada)
</script>
