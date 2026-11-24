<template>
  <section class="px-4 pb-8 xl:px-6">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold text-highlighted">Pendientes</h2>
        <p class="text-sm text-muted">{{ summary }}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton size="sm" :color="filter === '' ? 'primary' : 'neutral'" :variant="filter === '' ? 'solid' : 'outline'" @click="filter = ''">Todos {{ rows.length }}</UButton>
        <UButton size="sm" :color="filter === URGENT ? 'error' : 'neutral'" :variant="filter === URGENT ? 'solid' : 'outline'" @click="filter = URGENT">Urgentes {{ urgent }}</UButton>
        <UButton v-if="filter && filter !== URGENT" size="sm" color="neutral" variant="solid" trailing-icon="i-heroicons-x-mark" @click="filter = ''">{{ filter }}</UButton>
      </div>
    </div>

    <UAlert v-if="error" color="error" variant="soft" :title="error" class="mb-4" />
    <div class="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div class="overflow-hidden rounded-xl border border-default bg-default">
        <div v-if="loading" class="space-y-3 p-4"><USkeleton v-for="n in 4" :key="n" class="h-12" /></div>
        <p v-else-if="!shown.length" class="p-9 text-center text-muted">Sin pendientes.</p>
        <div v-else class="max-h-[560px] overflow-y-auto">
          <div v-for="(row, index) in shown" :key="index" class="flex flex-wrap items-center gap-3 border-b border-default px-4 py-3 last:border-0" :class="row.urgent ? 'bg-error/5' : ''">
            <UBadge :color="row.urgent ? 'error' : 'primary'" variant="solid" class="w-32 justify-center">{{ row.tag }}</UBadge>
            <UBadge color="neutral" variant="soft">{{ row.section }}</UBadge>
            <div class="min-w-48 flex-1">
              <p class="font-semibold text-highlighted">{{ row.title }}</p>
              <p class="text-sm text-muted">{{ row.detail }}</p>
            </div>
            <UButton size="sm" color="primary" variant="link" @click="navigateTo(row.to)">Ir →</UButton>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <button v-for="section in sections" :key="section.name" type="button" class="rounded-xl border bg-default p-4 text-left" :class="filter === section.name ? 'border-primary' : 'border-default'" @click="filter = filter === section.name ? '' : section.name">
          <span class="flex items-center justify-between">
            <span class="font-semibold text-highlighted">{{ section.name }}</span>
            <UBadge :color="section.urgent ? 'error' : section.total ? 'primary' : 'neutral'" variant="solid">{{ section.total }}</UBadge>
          </span>
          <span class="mt-1 block text-sm text-muted">{{ section.breakdown || 'Sin pendientes' }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ChinaCajaService } from '~/services/chinaCajaService'
import type { ChinaPending } from '~/types/china-caja'

const URGENT = 'urgentes'
const ORDER = ['Seguimiento', 'Carga consolidada', 'Flujo de caja', 'Operaciones', 'Pago proveedores', 'Contenedores']
const rows = ref<ChinaPending[]>([])
const loading = ref(true)
const error = ref('')
const filter = ref('')

const urgent = computed(() => rows.value.filter((row) => row.urgent).length)
const shown = computed(() => rows.value.filter((row) => !filter.value || (filter.value === URGENT ? row.urgent : row.section === filter.value)))
const summary = computed(() => {
  if (loading.value) return 'Cargando…'
  if (!rows.value.length) return 'No tienes pendientes'
  return `Tienes ${rows.value.length} pendientes${urgent.value ? `, ${urgent.value} urgentes` : ''}`
})
const sections = computed(() => ORDER.map((name) => {
  const items = rows.value.filter((row) => row.section === name)
  const kinds = new Map<string, number>()
  items.forEach((row) => kinds.set(row.kind, (kinds.get(row.kind) || 0) + row.count))
  return {
    name,
    total: items.reduce((sum, row) => sum + row.count, 0),
    urgent: items.some((row) => row.urgent),
    breakdown: [...kinds].map(([kind, count]) => `${kind}: ${count}`).join(' · ')
  }
}))

onMounted(async () => {
  try {
    rows.value = (await ChinaCajaService.pending()).data
  } catch (e: any) {
    error.value = e?.message || 'No se pudieron cargar los pendientes.'
  } finally {
    loading.value = false
  }
})
</script>
