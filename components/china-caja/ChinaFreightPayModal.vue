<template>
  <UModal :open="open" title="Pagar fletes" :ui="MODAL_UI" @update:open="(value: boolean) => !value && emit('close')">
    <template #body>
      <div class="flex flex-col gap-3">
        <div class="max-h-60 overflow-y-auto rounded-lg border border-default">
          <label v-for="row in rows" :key="row.id" class="flex cursor-pointer items-center gap-3 border-b border-default p-3 text-sm last:border-0">
            <UCheckbox :model-value="ids.includes(row.id)" @update:model-value="(on: boolean | 'indeterminate') => toggle(row.id, on === true)" />
            <span class="flex-1">{{ row.label }} · {{ row.country }} <span class="text-muted">{{ row.data.shipping_line || '' }}</span></span>
            <strong>{{ usd(row.data.freight_usd) }}</strong>
          </label>
        </div>
        <UFormField label="Fecha de pago"><UInput v-model="paidOn" type="date" class="w-full" /></UFormField>
        <YuanFilePick label="Adjuntar voucher del pago (PDF o imagen)" :accept="CHINA_FILE_ACCEPT" @pick="(file) => { voucher = file }" />
        <p class="text-right font-semibold">Total {{ usd(total) }}</p>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="emit('close')">Cancelar</UButton>
        <UButton color="primary" :disabled="!ids.length || !voucher || !paidOn" @click="voucher && emit('pay', ids, paidOn, voucher)">Registrar pago</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import YuanFilePick from '~/components/pago-proveedor/YuanFilePick.vue'
import { CHINA_FILE_ACCEPT, MODAL_UI } from '~/constants/chinaCaja'
import type { ChinaContainer } from '~/types/china-caja'
import { chinaToday } from '~/utils/chinaCaja'
import { usd } from '~/utils/yuanFormat'

const props = defineProps<{ open: boolean; rows: ChinaContainer[]; preselected: number[] }>()
const emit = defineEmits<{ close: []; pay: [ids: number[], paidOn: string, voucher: File] }>()

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

function toggle(id: number, on: boolean) {
  ids.value = on ? [...ids.value, id] : ids.value.filter((value) => value !== id)
}
</script>
