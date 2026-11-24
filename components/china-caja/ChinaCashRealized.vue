<template>
  <section class="cc-card overflow-hidden">
    <div class="cc-between border-b border-(--cc-line) px-5 py-4">
      <span class="cc-title-row"><span class="cc-title">Realizados · {{ periodLabel }}</span><ChinaInfo topic="movs" /></span>
      <div class="flex flex-wrap gap-1.5">
        <button v-for="item in origins" :key="item.label" type="button" class="cc-chip cc-chip--sm" :class="{ on: origin === item.label }" @click="emit('origin', item.label)">{{ item.label }} <strong>{{ item.count }}</strong></button>
      </div>
    </div>
    <div class="overflow-x-auto">
      <div class="cc-moves">
        <div class="cc-moves-row cc-moves-head"><div>FECHA</div><div>ORIGEN</div><div>DETALLE</div><div class="text-right">INGRESO</div><div class="text-right">EGRESO</div><div>ESTADO</div></div>
        <div class="max-h-[520px] overflow-y-auto">
          <div v-for="(row, index) in rows" :key="index" class="cc-moves-row">
            <div class="text-(--cc-body)">{{ dmy(row.date, true) }}</div>
            <div><span class="cc-tag font-medium" :class="CHINA_ORIGIN_TONE[row.origin]">{{ row.origin }}</span></div>
            <div class="flex flex-col gap-px"><span class="cc-cut font-medium">{{ row.title }}</span><span class="cc-sub cc-cut">{{ row.detail }}</span></div>
            <div class="cc-t-green text-right font-semibold">{{ row.type === 'in' ? `+${money(row.amount)}` : '' }}</div>
            <div class="cc-t-orange text-right font-semibold">{{ row.type === 'out' ? `−${money(row.amount)}` : '' }}</div>
            <div><span class="cc-pill cc-c-green !font-medium">Real</span></div>
          </div>
        </div>
        <div v-if="!rows.length" class="px-5 py-7 text-(--cc-muted)">Sin movimientos realizados en este filtro.</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import ChinaInfo from '~/components/china-caja/ChinaInfo.vue'
import { CHINA_ORIGIN_TONE } from '~/constants/chinaCaja'
import type { ChinaCashMovement } from '~/types/china-caja'
import { dmy } from '~/utils/chinaCaja'

defineProps<{ rows: ChinaCashMovement[]; origins: Array<{ label: string; count: number }>; origin: string; periodLabel: string; money: (value: number) => string }>()
const emit = defineEmits<{ origin: [value: string] }>()
</script>
