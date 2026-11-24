<template>
  <ChinaWindow :open="open" title="Pago de flete" subtitle="Elige los contenedores que cubre este pago y adjunta un solo voucher." width="w-full max-w-[600px]" @close="emit('close')">
    <div class="flex flex-col overflow-hidden rounded-[10px] border border-(--cc-line2)">
      <button v-for="row in rows" :key="row.id" type="button" class="flex items-center justify-between gap-3 border-b border-(--cc-line) px-3.5 py-[11px] text-left text-sm" :class="ids.includes(row.id) ? 'bg-(--cc-orange-soft)' : ''" @click="toggle(row.id)">
        <span class="cc-check cc-check--orange !size-5" :class="{ on: ids.includes(row.id) }">{{ ids.includes(row.id) ? '✓' : '' }}</span>
        <span class="cc-stack flex-1"><span class="font-semibold">{{ row.label }} · {{ row.country }}</span><span class="cc-sub">{{ row.data.shipping_line || '—' }} · BL {{ row.data.bl_number || 'pendiente' }}</span></span>
        <span class="font-semibold">{{ usd(row.data.freight_usd) }}</span>
      </button>
      <div v-if="!rows.length" class="p-3.5 text-sm text-(--cc-muted)">No hay contenedores con flete por pagar.</div>
      <div class="flex justify-between bg-(--cc-softer) px-3.5 py-3 text-[15px] font-bold"><span>{{ ids.length }} seleccionados</span><span>{{ usd(total) }}</span></div>
    </div>
    <label class="cc-field">Fecha de pago<UInput v-model="paidOn" type="date" variant="none" :ui="{ base: 'cc-input !text-[15px]' }" /></label>
    <ChinaFileDrop :file="voucher" label="Adjuntar voucher del pago (PDF o imagen)" hint="Opcional" hint-tone="text-(--cc-muted)" icon @pick="(file) => { voucher = file }" />
    <template #footer>
      <button type="button" class="cc-btn cc-btn--plain cc-btn--lg" @click="emit('close')">Cancelar</button>
      <button type="button" class="cc-btn cc-btn--lg" :disabled="!ids.length || !paidOn" @click="emit('pay', ids, paidOn, voucher)">Guardar pago</button>
    </template>
  </ChinaWindow>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ChinaFileDrop from '~/components/china-caja/ChinaFileDrop.vue'
import ChinaWindow from '~/components/china-caja/ChinaWindow.vue'
import type { ChinaContainer } from '~/types/china-caja'
import { chinaToday } from '~/utils/chinaCaja'
import { usd } from '~/utils/yuanFormat'

const props = defineProps<{ open: boolean; rows: ChinaContainer[]; preselected: number[] }>()
const emit = defineEmits<{ close: []; pay: [ids: number[], paidOn: string, voucher: File | null] }>()

const ids = ref<number[]>([])
const paidOn = ref('')
const voucher = ref<File | null>(null)
const total = computed(() => props.rows.filter((row) => ids.value.includes(row.id)).reduce((sum, row) => sum + (row.data.freight_usd || 0), 0))

watch(() => props.open, (open) => {
  if (!open) return
  ids.value = [...props.preselected]
  paidOn.value = chinaToday()
  voucher.value = null
})

function toggle(id: number) {
  ids.value = ids.value.includes(id) ? ids.value.filter((value) => value !== id) : [...ids.value, id]
}
</script>
