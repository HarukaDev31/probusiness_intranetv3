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
        @click="setTab('resumen')"
      >
        Resumen
      </button>
      <button
        type="button"
        class="border-b-2 px-3 py-2 text-sm font-medium"
        :class="tab === 'detalle' ? 'border-primary text-highlighted' : 'border-transparent text-muted'"
        @click="setTab('detalle')"
      >
        Detalle operativo
      </button>
      <button
        type="button"
        class="border-b-2 px-3 py-2 text-sm font-medium"
        :class="tab === 'tiempos' ? 'border-primary text-highlighted' : 'border-transparent text-muted'"
        @click="setTab('tiempos')"
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
import { computed, onMounted, watch } from 'vue'
import { navigateTo, useRoute, useRouter } from '#imports'
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

const TABS = ['resumen', 'detalle', 'tiempos'] as const
type IndicadoresTab = (typeof TABS)[number]

const route = useRoute()
const router = useRouter()
const { fetchCurrentUser, currentRole } = useUserRole()
const { data, error, cargar } = useSoporteTiIndicadores()
const { withSpinner } = useSpinner()
const { showError } = useModal()

/** Cambios de mes/área hechos desde esta página: el watch no debe volver a cargar. */
let saltosWatchFiltros = 0

function textoQuery(key: string): string {
  const raw = route.query[key]
  const value = Array.isArray(raw) ? raw[0] : raw
  return value == null ? '' : String(value)
}

function esTab(value: string): value is IndicadoresTab {
  return (TABS as readonly string[]).includes(value)
}

const tab = computed<IndicadoresTab>(() => {
  const value = textoQuery('tab')
  return esTab(value) ? value : 'resumen'
})

const filtrosClave = computed(() => `${textoQuery('mes')}|${textoQuery('area')}`)

const mesesItems = computed(() =>
  (data.value?.meses || []).map((mes) => ({ label: mes.label, value: mes.value }))
)
const areasItems = computed(() => [
  { label: 'Todas las áreas', value: '' },
  ...(data.value?.areas || []).map((area) => ({ label: area, value: area }))
])

function armarQuery(partial: { tab?: IndicadoresTab; mes?: string | null; area?: string | null }) {
  const mes = partial.mes !== undefined ? partial.mes : (textoQuery('mes') || null)
  const area = partial.area !== undefined ? partial.area : (textoQuery('area') || null)
  const query: Record<string, string> = { tab: partial.tab ?? tab.value }
  if (mes) query.mes = mes
  if (area) query.area = area
  return query
}

async function escribirQuery(partial: { tab?: IndicadoresTab; mes?: string | null; area?: string | null }) {
  const query = armarQuery(partial)
  const mesCambia = (query.mes || '') !== textoQuery('mes')
  const areaCambia = (query.area || '') !== textoQuery('area')
  const igual =
    textoQuery('tab') === query.tab &&
    !mesCambia &&
    !areaCambia
  if (igual) return
  if (mesCambia || areaCambia) saltosWatchFiltros += 1
  await router.replace({ path: route.path, query })
}

async function recargarDesdeQuery() {
  const mes = textoQuery('mes') || null
  const area = textoQuery('area') || null
  try {
    await withSpinner(() => cargar(mes, area), 'Cargando indicadores...')
  } catch (e: unknown) {
    showError('Indicadores', e instanceof Error ? e.message : 'No se pudieron cargar los indicadores.')
    return
  }
  const mesResuelto = data.value?.mes || ''
  if (!mes && mesResuelto) {
    await escribirQuery({ mes: mesResuelto })
  }
}

function setTab(value: IndicadoresTab) {
  void escribirQuery({ tab: value })
}

function onMes(value: unknown) {
  const mes = String(value || '') || null
  void escribirQuery({ mes }).then(() => recargarDesdeQuery())
}

function onArea(value: unknown) {
  const area = String(value || '') || null
  void escribirQuery({ area }).then(() => recargarDesdeQuery())
}

function filtrarArea(area: string) {
  const siguiente = data.value?.area === area ? null : area
  void escribirQuery({ area: siguiente }).then(() => recargarDesdeQuery())
}

watch(filtrosClave, () => {
  if (saltosWatchFiltros > 0) {
    saltosWatchFiltros -= 1
    return
  }
  void recargarDesdeQuery()
})

onMounted(() => {
  fetchCurrentUser()
  if (!roleEsPmSoporteTi(currentRole.value)) {
    void navigateTo('/soporte-ti')
    return
  }
  const tabActual = textoQuery('tab')
  const preparar = esTab(tabActual) ? Promise.resolve() : escribirQuery({ tab: 'resumen' })
  void preparar.then(() => recargarDesdeQuery())
})
</script>
