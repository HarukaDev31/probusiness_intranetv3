<template>
  <div class="min-w-0 flex-[1_1_640px] overflow-x-auto">
    <div class="cc-cont">
      <div class="cc-cont-row cc-cont-head"><div>FECHA</div><div>CLIENTE</div><div>SERVICIO</div><div>CARGA / BL</div><div class="text-right">FLETE</div><div>ESTADO</div><div>PENDIENTES</div></div>
      <div v-if="loading" class="px-5 py-9 text-[15px] text-(--cc-muted)">Cargando…</div>
      <div v-else-if="!rows.length" class="px-5 py-9 text-[15px] text-(--cc-muted)">{{ emptyText }}</div>
      <button v-for="row in rows" :key="row.id" type="button" class="cc-cont-row" :class="{ on: row.id === selectedId }" @click="emit('select', row.id)">
        <div>{{ dmy(row.closing_on || row.closed_on) || '—' }}</div>
        <div class="cc-stack uppercase">
          <span class="cc-cut font-semibold text-(--cc-ink)" :title="row.client">{{ row.client }}</span>
          <span class="cc-sub cc-cut" :title="row.data.bl_consignee || ''">CNE: {{ row.data.bl_consignee || '—' }}</span>
          <span class="cc-sub">{{ row.country }}</span>
        </div>
        <div class="cc-stack"><span class="text-xs">Carga consolidada</span><span class="cc-cut font-semibold text-(--cc-ink)" :title="row.label">{{ row.label }}</span></div>
        <div class="flex flex-col items-start gap-1">
          <span class="flex flex-wrap items-center gap-2"><span class="text-(--cc-ink)">{{ row.data.container_type || '—' }}</span><span class="cc-tag !px-2 !py-0.5 font-medium" :class="containerArrivalTone(row)">{{ containerArrivalText(row) }}</span></span>
          <span class="cc-sub cc-cut max-w-full">BL <strong class="tracking-[.02em]" :class="row.data.bl_number ? 'text-(--cc-ink)' : 'cc-t-deep'">{{ row.data.bl_number || 'Pendiente' }}</strong></span>
        </div>
        <div class="text-right font-semibold text-(--cc-ink)">{{ row.data.freight_usd ? usd(row.data.freight_usd) : '—' }}</div>
        <div><span class="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-medium text-(--cc-ink)"><span class="size-2 flex-none rounded-full" :style="{ background: CHINA_CONTAINER_GROUP[row.status.group].color }" />{{ CHINA_CONTAINER_GROUP[row.status.group].label }}</span></div>
        <div class="flex gap-1"><span v-for="item in checks(row)" :key="item.code" class="cc-mini" :class="item.tone" :title="item.title">{{ item.code }}</span></div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CHINA_COLLECTION, CHINA_CONTAINER_GROUP } from '~/constants/chinaCaja'
import type { ChinaContainer } from '~/types/china-caja'
import { containerArrivalText, containerArrivalTone, dmy } from '~/utils/chinaCaja'
import { usd } from '~/utils/yuanFormat'

defineProps<{ rows: ChinaContainer[]; loading: boolean; selectedId: number | null; emptyText: string }>()
const emit = defineEmits<{ select: [id: number] }>()

/** Gris mientras no toca pedirlo, naranja cuando ya se solicitó, verde cuando está listo. */
function checks(row: ChinaContainer) {
  const tone = (done: boolean, due: boolean) => (done ? 'cc-c-green' : due ? 'cc-c-flete' : 'cc-c-faint')
  const collected = row.collection === 'paid'
  return [
    { code: 'BL', title: 'BL oficial', tone: tone(!!row.data.bl_official_name, row.status.bl_due) },
    { code: 'TLX', title: 'Telex', tone: tone(row.data.telex, row.status.arrival_due) },
    { code: 'COB', title: `Cobro cliente: ${CHINA_COLLECTION[row.collection].label}`, tone: row.collection === 'partial' ? 'cc-c-amber' : tone(collected, true) },
    { code: 'FLT', title: 'Flete pagado', tone: tone(row.freight.paid, row.status.arrival_due) }
  ]
}
</script>
