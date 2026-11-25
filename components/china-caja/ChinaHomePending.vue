<template>
  <div class="cc cc-home">
    <UAlert v-if="error" color="error" variant="soft" :title="error" class="w-full" />
    <section class="cc-card min-w-0 flex-[2_1_460px] overflow-hidden">
      <div class="cc-between border-b border-(--cc-line) px-5 py-4">
        <span class="flex items-center gap-2.5"><span class="text-[19px] font-semibold">Pendientes</span><span class="text-sm text-(--cc-muted)">{{ shown.length }} de {{ rows.length }}</span></span>
        <span class="flex flex-wrap gap-1.5">
          <button type="button" class="cc-chip cc-chip--sm" :class="{ on: filter === '' }" @click="filter = ''">Todos {{ rows.length }}</button>
          <button type="button" class="cc-chip cc-chip--sm" :class="{ on: filter === CHINA_PENDING_URGENT }" @click="filter = CHINA_PENDING_URGENT">Urgentes {{ urgent }}</button>
          <button v-if="filter && filter !== CHINA_PENDING_URGENT" type="button" class="cc-chip cc-chip--sm on" @click="filter = ''">{{ filter }} ✕</button>
        </span>
      </div>
      <div class="max-h-[620px] overflow-y-auto">
        <div v-if="loading" class="space-y-3 p-5"><USkeleton v-for="n in 4" :key="n" class="h-14" /></div>
        <div v-else-if="!shown.length" class="cc-t-green px-5 py-9 text-center text-[15px]">✓ No hay pendientes en este filtro</div>
        <div v-for="(row, index) in shown" :key="index" class="cc-home-row" :class="row.urgent ? 'bg-(--cc-red-soft)' : 'bg-(--cc-orange-soft)'">
          <span class="cc-list-text">
            <span class="flex flex-wrap gap-1.5"><span class="cc-pill" :class="row.urgent ? 'cc-b-red' : 'cc-b-orange'">{{ row.tag }}</span><span class="cc-tag" :class="CHINA_SECTION_TONE[row.section]">{{ row.section }}</span></span>
            <strong class="cc-cut">{{ row.title }}</strong>
            <span class="cc-sub cc-cut">{{ row.detail }}</span>
          </span>
          <button type="button" class="cc-btn cc-btn--sm" @click="navigateTo(row.to)">Ir →</button>
        </div>
      </div>
    </section>
    <div class="flex min-w-0 flex-[1_1_260px] flex-col gap-2.5">
      <button v-for="section in sections" :key="section.name" type="button" class="cc-home-sec" :class="{ on: filter === section.name, 'opacity-60': !section.total }" @click="filter = filter === section.name ? '' : section.name">
        <span class="flex items-center justify-between gap-2.5"><strong class="text-[15px]">{{ section.name }}</strong><span class="min-w-[26px] rounded-[20px] px-[9px] py-0.5 text-center text-[13px] font-bold" :class="section.urgent ? 'cc-b-red' : section.total ? 'cc-b-orange' : 'cc-b-none'">{{ section.total }}</span></span>
        <span class="flex flex-wrap gap-1.5"><span v-for="item in section.items" :key="item" class="cc-tag cc-c-soft">{{ item }}</span></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CHINA_PENDING_URGENT, CHINA_SECTION_TONE } from '~/constants/chinaCaja'
import type { useChinaPending } from '~/composables/china-caja/useChinaPending'

// Lo carga la página: el banner también muestra cuántos hay.
const props = defineProps<{ pending: ReturnType<typeof useChinaPending> }>()
const { rows, loading, error, filter, urgent, shown, sections } = props.pending
</script>
