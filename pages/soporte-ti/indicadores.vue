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
          :model-value="textoQuery('mes') || data.mes"
          :items="mesesItems"
          class="w-44"
          @update:model-value="onMes"
        />
        <USelect
          :model-value="textoQuery('area')"
          :items="areasItems"
          class="w-52"
          @update:model-value="onArea"
        />
      </div>
      <div v-else class="flex gap-2">
        <USkeleton class="h-9 w-44" />
        <USkeleton class="h-9 w-52" />
      </div>
    </div>

    <UCard v-if="error" color="warning" variant="subtle">
      <p class="text-sm">{{ error }}</p>
    </UCard>

    <div class="flex gap-2 border-b border-default">
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

    <p v-if="data && !loading" class="text-xs text-muted">Actualizado {{ data.actualizado_en }}</p>

    <SoporteTiIndicadoresSkeleton v-if="loading" :tab="tab" />
    <SoporteTiIndicadoresResumen
      v-else-if="data?.resumen && tab === 'resumen'"
      :data="data"
      @filtrar-area="filtrarArea"
    />
    <SoporteTiIndicadoresDetalle v-else-if="data?.detalle?.tipo_a && tab === 'detalle'" :data="data" />
    <SoporteTiIndicadoresTiempos
      v-else-if="data?.detalle && tab === 'tiempos'"
      :data="data"
      @pagina="onPagina"
      @pagina-fin="onPaginaFin"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { navigateTo, useRoute, useRouter } from '#imports'
import { roleEsPmSoporteTi } from '~/constants/roles'
import { useUserRole } from '~/composables/auth/useUserRole'
import { useSoporteTiIndicadores } from '~/composables/useSoporteTiIndicadores'
import { useModal } from '~/composables/commons/useModal'
import SoporteTiIndicadoresResumen from '~/components/soporte-ti/SoporteTiIndicadoresResumen.vue'
import SoporteTiIndicadoresDetalle from '~/components/soporte-ti/SoporteTiIndicadoresDetalle.vue'
import SoporteTiIndicadoresTiempos from '~/components/soporte-ti/SoporteTiIndicadoresTiempos.vue'
import SoporteTiIndicadoresSkeleton from '~/components/soporte-ti/SoporteTiIndicadoresSkeleton.vue'

definePageMeta({
  middleware: 'auth'
})

const TABS = ['resumen', 'detalle', 'tiempos'] as const
type IndicadoresTab = (typeof TABS)[number]

const route = useRoute()
const router = useRouter()
const { fetchCurrentUser, currentRole } = useUserRole()
const { data, error, loading, cargar } = useSoporteTiIndicadores()
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

function paginaQuery(key: string): number {
  const n = Number(textoQuery(key))
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
}

function claveDe(query: Record<string, string>) {
  const nextTab = esTab(query.tab || '') ? query.tab : 'resumen'
  const page = nextTab === 'tiempos' ? Number(query.page || 1) : 1
  const pageFin = nextTab === 'tiempos' ? Number(query.page_fin || 1) : 1
  return `${nextTab}|${query.mes || ''}|${query.area || ''}|${page}|${pageFin}`
}

const vistaClave = computed(() =>
  claveDe({
    tab: tab.value,
    mes: textoQuery('mes'),
    area: textoQuery('area'),
    page: textoQuery('page'),
    page_fin: textoQuery('page_fin')
  })
)

const mesesItems = computed(() =>
  (data.value?.meses || []).map((mes) => ({ label: mes.label, value: mes.value }))
)
const areasItems = computed(() => [
  { label: 'Todas las áreas', value: '' },
  ...(data.value?.areas || []).map((area) => ({ label: area, value: area }))
])

function armarQuery(partial: {
  tab?: IndicadoresTab
  mes?: string | null
  area?: string | null
  page?: number | null
  pageFin?: number | null
}) {
  const nextTab = partial.tab ?? tab.value
  const mes = partial.mes !== undefined ? partial.mes : (textoQuery('mes') || null)
  const area = partial.area !== undefined ? partial.area : (textoQuery('area') || null)
  const page = partial.page !== undefined ? partial.page || 1 : paginaQuery('page')
  const pageFin = partial.pageFin !== undefined ? partial.pageFin || 1 : paginaQuery('page_fin')
  const query: Record<string, string> = { tab: nextTab }
  if (mes) query.mes = mes
  if (area) query.area = area
  if (nextTab === 'tiempos') {
    if (page > 1) query.page = String(page)
    if (pageFin > 1) query.page_fin = String(pageFin)
  }
  return query
}

async function escribirQuery(partial: {
  tab?: IndicadoresTab
  mes?: string | null
  area?: string | null
  page?: number | null
  pageFin?: number | null
}) {
  const query = armarQuery(partial)
  const igual =
    textoQuery('tab') === (query.tab || '') &&
    textoQuery('mes') === (query.mes || '') &&
    textoQuery('area') === (query.area || '') &&
    textoQuery('page') === (query.page || '') &&
    textoQuery('page_fin') === (query.page_fin || '')
  if (igual) return
  if (claveDe(query) !== vistaClave.value) saltosWatchFiltros += 1
  await router.replace({ path: route.path, query })
}

async function recargarDesdeQuery() {
  const mes = textoQuery('mes') || null
  const area = textoQuery('area') || null
  try {
    await cargar(mes, area, tab.value, paginaQuery('page'), paginaQuery('page_fin'))
  } catch (e: unknown) {
    showError('Indicadores', e instanceof Error ? e.message : 'No se pudieron cargar los indicadores.')
    return
  }
  const mesResuelto = data.value?.mes || ''
  if (!mes && mesResuelto) {
    await escribirQuery({ mes: mesResuelto })
  }
}

function pedir(partial: {
  tab?: IndicadoresTab
  mes?: string | null
  area?: string | null
  page?: number | null
  pageFin?: number | null
}) {
  loading.value = true
  void escribirQuery(partial).then(() => recargarDesdeQuery())
}

function setTab(value: IndicadoresTab) {
  if (value === tab.value) return
  pedir({ tab: value })
}

function onMes(value: unknown) {
  pedir({ mes: String(value || '') || null, page: 1, pageFin: 1 })
}

function onArea(value: unknown) {
  pedir({ area: String(value || '') || null, page: 1, pageFin: 1 })
}

function filtrarArea(area: string) {
  pedir({ area: data.value?.area === area ? null : area, page: 1, pageFin: 1 })
}

function onPagina(page: number) {
  pedir({ page })
}

function onPaginaFin(page: number) {
  pedir({ pageFin: page })
}

watch(vistaClave, () => {
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
