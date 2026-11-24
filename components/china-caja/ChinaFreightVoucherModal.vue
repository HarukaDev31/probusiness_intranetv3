<template>
  <ChinaWindow :open="!!container" :title="`${container?.freight.code || ''} · Pago de flete`" :subtitle="container ? `${dmy(container.freight.paid_on)} · ${usd(total)}` : ''" @close="emit('close')">
    <div class="flex items-center gap-2.5 rounded-[10px] bg-(--cc-soft) px-3.5 py-3 text-sm">
      <UIcon name="i-lucide-paperclip" class="size-4 text-(--cc-orange)" /><span class="cc-grow cc-cut">{{ container?.freight.voucher_name || 'Sin voucher adjunto' }}</span>
      <button v-if="container?.freight.voucher_url" type="button" class="cc-link" @click="viewer = true">Ver</button>
    </div>
    <span class="text-[13px] font-semibold text-(--cc-body)">Contenedores incluidos</span>
    <div class="flex flex-wrap gap-1.5"><span v-for="row in included" :key="row.id" class="rounded-md bg-(--cc-empty) px-2.5 py-1 text-[13px]">{{ row.label }} · {{ row.country }}</span></div>
    <template #footer>
      <button type="button" class="cc-link cc-link--danger mr-auto" @click="cancel">Anular pago</button>
      <button type="button" class="cc-btn cc-btn--plain" @click="emit('close')">Cerrar</button>
    </template>
    <VoucherViewerModal :open="viewer" :url="container?.freight.voucher_url || null" :name="container?.freight.voucher_name || null" title="Voucher del flete" @close="viewer = false" />
  </ChinaWindow>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ChinaWindow from '~/components/china-caja/ChinaWindow.vue'
import VoucherViewerModal from '~/components/pago-proveedor/VoucherViewerModal.vue'
import { useModal } from '~/composables/commons/useModal'
import type { ChinaContainer } from '~/types/china-caja'
import { dmy } from '~/utils/chinaCaja'
import { usd } from '~/utils/yuanFormat'

const props = defineProps<{ container: ChinaContainer | null; rows: ChinaContainer[] }>()
const emit = defineEmits<{ close: []; cancel: [paymentId: number] }>()
const { showConfirmation } = useModal()
const viewer = ref(false)
const included = computed(() => props.rows.filter((row) => row.freight.payment_id !== null && row.freight.payment_id === props.container?.freight.payment_id))
const total = computed(() => included.value.reduce((sum, row) => sum + (row.freight.usd_amount || row.data.freight_usd || 0), 0))

function cancel() {
  const id = props.container?.freight.payment_id
  if (!id) return
  showConfirmation(`¿Anular ${props.container?.freight.code}?`, 'Los contenedores volverán a "Por pagar".', () => emit('cancel', id))
}
</script>
