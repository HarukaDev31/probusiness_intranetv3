<template>
  <UModal :open="!!week || monthOpen" :title="week ? 'Cerrar semana' : 'Cerrar mes'" :ui="MODAL_UI" @update:open="(value: boolean) => !value && emit('close')">
    <template #body>
      <div class="flex flex-col gap-3">
        <template v-if="week">
          <p class="text-sm text-muted">{{ dayLabel(week.starts_on) }} – {{ dayLabel(week.ends_on) }}. Al cerrar queda en solo lectura.</p>
          <YuanFilePick label="Pantallazo del banco (obligatorio)" :accept="CHINA_FILE_ACCEPT" @pick="(file) => { screenshot = file }" />
        </template>
        <UFormField :label="week ? 'Saldo del banco (RMB)' : 'Saldo final del estado de cuenta (RMB)'" :help="week ? undefined : 'Será el saldo inicial del mes siguiente.'">
          <UInputNumber v-model="balance" :step="0.01" :ui="AMOUNT_UI" class="w-full" />
        </UFormField>
        <div v-if="week?.usd_to_exchange.length" class="rounded-lg border border-default p-3 text-sm">
          <p class="mb-1 font-semibold text-highlighted">USD por cambiar</p>
          <div v-for="row in week.usd_to_exchange" :key="row.id" class="flex items-center gap-2 py-1">
            <span class="flex-1">{{ row.code }} · {{ row.operations.join(', ') }} · {{ row.client }}</span>
            <strong>{{ usd(row.usd) }}</strong>
            <UButton size="xs" variant="link" :to="`/operaciones-china?cobro=${row.id}`">Ir →</UButton>
          </div>
          <p class="text-xs text-muted">Los que no se cambien pasan solos a la semana siguiente.</p>
        </div>
      </div>
    </template>
    <template #footer>
      <UButton class="ml-auto" :disabled="balance === null || (!!week && !screenshot)" @click="submit">{{ week ? 'Cerrar semana' : 'Cerrar mes' }}</UButton>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import YuanFilePick from '~/components/pago-proveedor/YuanFilePick.vue'
import { AMOUNT_UI, CHINA_FILE_ACCEPT, MODAL_UI } from '~/constants/chinaCaja'
import type { ChinaCashWeek } from '~/types/china-caja'
import { dayLabel, usd } from '~/utils/yuanFormat'

const props = defineProps<{ week: ChinaCashWeek | null; monthOpen: boolean }>()
const emit = defineEmits<{ close: []; week: [startsOn: string, balance: number, screenshot: File]; month: [balance: number] }>()
const balance = ref<number | null>(null)
const screenshot = ref<File | null>(null)

watch(() => [props.week, props.monthOpen], () => {
  balance.value = null
  screenshot.value = null
})

function submit() {
  if (balance.value === null) return
  if (!props.week) return emit('month', balance.value)
  if (screenshot.value) emit('week', props.week.starts_on, balance.value, screenshot.value)
}
</script>
