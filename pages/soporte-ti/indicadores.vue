<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4 md:p-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <UButton
          variant="ghost"
          color="neutral"
          icon="i-heroicons-arrow-left"
          label="Solicitudes"
          @click="navigateTo('/soporte-ti')"
        />
        <h1 class="mt-2 text-xl font-semibold">Indicadores de Soporte TI</h1>
        <p class="text-sm text-muted">Resumen del mes y detalle de proyectos y requerimientos.</p>
      </div>
      <div v-if="data" class="flex flex-wrap items-center gap-2">
        <USelect
          :model-value="data.mes"
          :items="mesesItems"
          class="w-44"
          @update:model-value="onMes"
        />
        <USelect
          :model-value="data.area || ''"
          :items="areasItems"
          class="w-52"
          @update:model-value="onArea"
        />
      </div>
    </div>

    <UCard v-if="error" color="warning" variant="subtle">
      <p class="text-sm">{{ error }}</p>
    </UCard>

    <div v-if="data" class="flex gap-2 border-b border-default">
      <button
        type="button"
        class="border-b-2 px-3 py-2 text-sm font-medium"
        :class="tab === 'resumen' ? 'border-primary text-highlighted' : 'border-transparent text-muted'"
        @click="tab = 'resumen'"
      >
        Resumen
      </button>
      <button
        type="button"
        class="border-b-2 px-3 py-2 text-sm font-medium"
        :class="tab === 'detalle' ? 'border-primary text-highlighted' : 'border-transparent text-muted'"
        @click="tab = 'detalle'"
      >
        Detalle operativo
      </button>
      <button
        type="button"
        class="border-b-2 px-3 py-2 text-sm font-medium"
        :class="tab === 'tiempos' ? 'border-primary text-highlighted' : 'border-transparent text-muted'"
        @click="tab = 'tiempos'"
      >
        Tiempos y SLA
      </button>
    </div>

    <p v-if="data" class="text-xs text-muted">Actualizado {{ data.actualizado_en }}</p>

    <SoporteTiIndicadoresResumen
      v-if="data && tab === 'resumen'"
      :data="data"
      @filtrar-area="filtrarArea"
    />
    <SoporteTiIndicadoresDetalle v-else-if="data && tab === 'detalle'" :data="data" />
    <SoporteTiIndicadoresTiempos v-else-if="data && tab === 'tiempos'" :data="data" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { navigateTo } from '#imports'
import { roleEsPmSoporteTi } from '~/constants/roles'
import { useUserRole } from '~/composables/auth/useUserRole'
import { useSoporteTiIndicadores } from '~/composables/useSoporteTiIndicadores'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'
import SoporteTiIndicadoresResumen from '~/components/soporte-ti/SoporteTiIndicadoresResumen.vue'
import SoporteTiIndicadoresDetalle from '~/components/soporte-ti/SoporteTiIndicadoresDetalle.vue'
import SoporteTiIndicadoresTiempos from '~/components/soporte-ti/SoporteTiIndicadoresTiempos.vue'

definePageMeta({
  middleware: 'auth'
})

const { fetchCurrentUser, currentRole } = useUserRole()
const { data, error, cargar } = useSoporteTiIndicadores()
const { withSpinner } = useSpinner()
const { showError } = useModal()

const tab = ref<'resumen' | 'detalle' | 'tiempos'>('resumen')

const mesesItems = computed(() =>
  (data.value?.meses || []).map((mes) => ({ label: mes.label, value: mes.value }))
)
const areasItems = computed(() => [
  { label: 'Todas las áreas', value: '' },
  ...(data.value?.areas || []).map((area) => ({ label: area, value: area }))
])

async function recargar(mes?: string | null, area?: string | null) {
  try {
    await withSpinner(() => cargar(mes, area), 'Cargando indicadores...')
  } catch (e: unknown) {
    showError('Indicadores', e instanceof Error ? e.message : 'No se pudieron cargar los indicadores.')
  }
}

function onMes(value: unknown) {
  void recargar(String(value || ''), data.value?.area)
}

function onArea(value: unknown) {
  const area = String(value || '')
  void recargar(data.value?.mes, area || null)
}

function filtrarArea(area: string) {
  const siguiente = data.value?.area === area ? null : area
  void recargar(data.value?.mes, siguiente)
}

onMounted(() => {
  fetchCurrentUser()
  if (!roleEsPmSoporteTi(currentRole.value)) {
    void navigateTo('/soporte-ti')
    return
  }
  void recargar()
})
</script>
