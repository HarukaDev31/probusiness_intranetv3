<template>
  <div class="cc-kpi" :style="{ '--kpi': card.accent }">
    <span class="cc-kpi-top">
      <span class="flex min-w-0 items-start gap-2">
        <span class="cc-kpi-icon" :class="card.iconBg"><UIcon v-if="card.icon" :name="card.icon" class="size-[17px]" /></span>
        <span class="cc-kpi-label">{{ card.label }}</span>
      </span>
      <ChinaInfo :topic="card.info" />
    </span>
    <span class="cc-kpi-value" :class="card.tone">{{ card.value }}</span>
    <span class="cc-kpi-sub">{{ card.sub }}</span>
    <span v-if="card.compare" class="cc-kpi-cmp" :class="card.compareTone">{{ card.compare }}</span>
  </div>
</template>

<script setup lang="ts">
import ChinaInfo from '~/components/china-caja/ChinaInfo.vue'
import type { ChinaKpiCard } from '~/types/china-caja'

defineProps<{ card: ChinaKpiCard }>()
</script>
