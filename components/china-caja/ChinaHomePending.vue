<template>
  <section class="px-4 pb-8 xl:px-6">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold text-highlighted">Pendientes</h2>
        <p class="text-sm text-muted">{{ summary }}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton size="sm" :color="filter === '' ? 'primary' : 'neutral'" :variant="filter === '' ? 'solid' : 'outline'" @click="() => { filter = '' }">Todos {{ rows.length }}</UButton>
        <UButton size="sm" :color="filter === CHINA_PENDING_URGENT ? 'error' : 'neutral'" :variant="filter === CHINA_PENDING_URGENT ? 'solid' : 'outline'" @click="() => { filter = CHINA_PENDING_URGENT }">Urgentes {{ urgent }}</UButton>
        <UButton v-if="filter && filter !== CHINA_PENDING_URGENT" size="sm" color="neutral" variant="solid" trailing-icon="i-heroicons-x-mark" @click="() => { filter = '' }">{{ filter }}</UButton>
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
            <UButton size="sm" color="primary" variant="link" @click="() => { navigateTo(row.to) }">Ir →</UButton>
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
import { onMounted } from 'vue'
import { useChinaPending } from '~/composables/china-caja/useChinaPending'
import { CHINA_PENDING_URGENT } from '~/constants/chinaCaja'

const { rows, loading, error, filter, urgent, shown, summary, sections, load } = useChinaPending()

onMounted(load)
</script>
