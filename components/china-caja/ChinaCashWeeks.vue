<template>
  <section>
    <h2 class="mb-2 text-lg font-bold text-highlighted">Semanas de {{ monthLabel(month) }}</h2>
    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <UCard v-for="week in weeks" :key="week.starts_on" :class="week.overdue ? 'ring-error' : ''">
        <button type="button" class="w-full text-left" @click="emit('pick', week.starts_on)">
          <p class="font-semibold" :class="selected === week.starts_on ? 'text-primary' : 'text-highlighted'">{{ dayLabel(week.starts_on) }} – {{ dayLabel(week.ends_on) }}</p>
          <p class="text-sm text-success">+{{ rmb(week.totals.income) }}</p>
          <p class="text-sm text-toned">−{{ rmb(week.totals.expense) }}</p>
          <div class="mt-2 flex h-14 items-end gap-1">
            <span v-for="bar in bars(week)" :key="bar.key" class="w-4 rounded-t" :class="bar.tone" :style="{ height: bar.height }" />
          </div>
        </button>
        <div class="mt-2 text-sm">
          <template v-if="week.closing">
            <p>Saldo <strong>{{ rmbSigned(week.closing.balance) }}</strong></p>
            <UButton v-if="week.closing.screenshot_url" class="px-0" size="xs" color="primary" variant="link" @click="emit('screenshot', week)">Ver pantallazo</UButton>
          </template>
          <UButton v-else-if="week.can_close" size="sm" :color="week.overdue ? 'error' : 'primary'" @click="emit('close-week', week)">Cerrar semana</UButton>
          <p v-else class="text-muted">Se cierra el {{ dayLabel(week.due_on) }}</p>
        </div>
      </UCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ChinaCashWeek } from '~/types/china-caja'
import { rmbSigned } from '~/utils/chinaCaja'
import { dayLabel, monthLabel, rmb } from '~/utils/yuanFormat'

const props = defineProps<{ month: string; weeks: ChinaCashWeek[]; selected: string }>()
const emit = defineEmits<{ pick: [startsOn: string]; 'close-week': [week: ChinaCashWeek]; screenshot: [week: ChinaCashWeek] }>()

// Sólido = ya pasó; claro = por realizar.
const BARS = [
  { key: 'income', tone: 'bg-success' }, { key: 'income_projected', tone: 'bg-success/30' },
  { key: 'expense', tone: 'bg-primary' }, { key: 'expense_projected', tone: 'bg-primary/30' }
] as const
const top = computed(() => Math.max(1, ...props.weeks.flatMap((week) => BARS.map(({ key }) => week.totals[key]))))

function bars(week: ChinaCashWeek) {
  return BARS.map((bar) => ({ ...bar, height: `${Math.round(week.totals[bar.key] / top.value * 100)}%` }))
}
</script>
