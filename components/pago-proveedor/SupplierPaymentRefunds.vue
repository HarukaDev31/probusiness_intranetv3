<template>
  <div>
    <template v-if="!modalOnly">
    <p v-if="!embedded" class="mb-3 text-sm text-muted">El dinero sale fuera de la intranet. Aquí solo apruebas el reembolso y dejas el voucher.</p>
    <div v-if="!embedded" class="mb-3 flex flex-wrap gap-2">
      <button
        type="button"
        class="rounded-lg px-3 py-1.5 text-sm font-semibold"
        :class="bucket === 'solicitado' ? 'bg-primary/10 text-primary' : 'bg-elevated text-muted'"
        @click="changeBucket('solicitado')"
      >
        Solicitados<span v-if="pendingCount" class="ml-1 text-xs">({{ pendingCount }})</span>
      </button>
      <button
        type="button"
        class="rounded-lg px-3 py-1.5 text-sm font-semibold"
        :class="bucket === 'aprobado' ? 'bg-primary/10 text-primary' : 'bg-elevated text-muted'"
        @click="changeBucket('aprobado')"
      >
        Aprobados
      </button>
    </div>
    <div class="overflow-x-auto rounded-lg border border-default bg-default">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
            <th class="px-3.5 py-3">Origen</th>
            <th class="px-3.5 py-3">Cliente</th>
            <th class="px-3.5 py-3">Proveedor</th>
            <th class="px-3.5 py-3">Cómo se calcula</th>
            <th class="px-3.5 py-3">Importe</th>
            <th class="px-3.5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading">
            <tr v-for="row in 4" :key="`sk-${row}`">
              <td v-for="col in 6" :key="col" class="px-3.5 py-3"><USkeleton class="h-4 w-full" /></td>
            </tr>
          </template>
          <tr v-else-if="!rows.length">
            <td colspan="6" class="px-3.5 py-8 text-center text-muted">
              {{ bucket === 'solicitado' ? 'No hay reembolsos solicitados.' : 'No hay reembolsos aprobados.' }}
            </td>
          </tr>
          <template v-else>
            <tr v-for="row in rows" :key="row.id" class="border-t border-default">
              <td class="px-3.5 py-3 font-semibold">{{ row.origin_label }}</td>
              <td class="px-3.5 py-3">
                {{ row.client_name || '—' }}
                <div class="text-xs text-muted">{{ row.consolidation }}</div>
              </td>
              <td class="px-3.5 py-3">{{ row.supplier_code || '—' }}</td>
              <td class="px-3.5 py-3 text-muted">
                <ul class="space-y-0.5">
                  <li v-for="(line, index) in (row.calculation_lines?.length ? row.calculation_lines : [row.calculation])" :key="index">{{ line }}</li>
                </ul>
              </td>
              <td class="px-3.5 py-3 font-semibold">${{ money(row.amount) }}</td>
              <td class="px-3.5 py-3 text-right">
                <div v-if="row.can_approve" class="flex justify-end gap-2">
                  <UButton size="sm" color="primary" @click="open(row)">Aprobar</UButton>
                  <UButton size="sm" color="neutral" variant="outline" @click="startReject(row)">Rechazar</UButton>
                </div>
                <div v-else class="space-y-1">
                  <UBadge color="neutral" variant="soft" size="sm" :label="row.status_label" />
                  <div v-if="row.voucher_url" class="text-xs">
                    <a :href="row.voucher_url" target="_blank" rel="noopener" class="font-semibold text-primary">Ver voucher</a>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    </template>

    <SupplierPaymentWindow
      :open="opened"
      title="Reembolso solicitado"
      :subtitle="selected ? `${selected.client_name || 'Cliente'} · Consolidado ${selected.consolidation || '—'}` : ''"
      :code="selected?.request_code || selected?.supplier_code"
      :hint="selected?.can_approve ? 'El reembolso se hace fuera de la intranet: al aprobarlo, registras su voucher.' : undefined"
      wide
      @close="opened = false"
    >
      <template #pill>
        <UBadge :color="selected?.can_approve ? 'warning' : 'success'" variant="soft" :label="selected?.can_approve ? 'Por aprobar' : (selected?.status_label || 'Revisado')" />
      </template>
      <div v-if="selected" class="grid gap-4 lg:grid-cols-3">
        <SupplierPaymentCard title="Solicitud" icon="i-lucide-file-text">
          <SupplierPaymentFact label="Cliente" :value="selected.client_name || '—'" />
          <SupplierPaymentFact label="N.° de consolidado" :value="selected.consolidation || '—'" />
          <SupplierPaymentFact label="Código de proveedor" :value="selected.supplier_code || '—'" />
          <SupplierPaymentFact v-if="selected.supplier_name" label="Proveedor" :value="selected.supplier_name" />
          <SupplierPaymentFact v-if="selected.product" label="Producto" :value="selected.product" />
          <SupplierPaymentFact v-if="selected.currency" label="Tipo de pago" :value="selected.currency === 'RMB' ? 'RMB / Transferencia' : 'USD / T-T'" />
        </SupplierPaymentCard>
        <SupplierPaymentCard title="Reembolso" icon="i-lucide-circle-dollar-sign">
          <p class="text-3xl font-bold">${{ money(selected.amount) }}</p>
          <span class="w-fit rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">USD</span>
          <p class="text-sm text-muted">Monto a devolver al cliente.</p>
          <SupplierPaymentFact label="Origen" :value="selected.origin_label" />
          <SupplierPaymentFact v-if="selected.reason" label="Motivo" :value="selected.reason" />
          <SupplierPaymentFact
            v-if="selected.requested_at"
            label="Solicitado"
            :value="`${new Date(selected.requested_at).toLocaleDateString('es-PE')} · Ventas`"
          />
        </SupplierPaymentCard>
        <SupplierPaymentCard title="Cómo se calcula" icon="i-lucide-chart-no-axes-column">
          <ul class="space-y-1 text-sm text-highlighted">
            <li v-for="(line, index) in calculationLines" :key="index">{{ line }}</li>
          </ul>
          <p class="mt-2 text-xs text-muted">Total ${{ money(selected.amount) }}</p>
        </SupplierPaymentCard>
      </div>
      <form v-if="selected?.can_approve" id="refund-voucher" class="grid gap-3 rounded-2xl border border-default bg-elevated p-4 text-sm sm:grid-cols-2" @submit.prevent="approve">
        <h4 class="text-[15px] font-bold text-highlighted sm:col-span-2">Voucher del reembolso</h4>
        <UFormField label="Importe" required><UInput v-model.number="form.importe" type="number" min="0" step="0.01" class="w-full" /></UFormField>
        <UFormField label="Fecha" required><UInput v-model="form.fecha" type="date" class="w-full" /></UFormField>
        <UFormField label="Banco" required><USelect v-model="form.banco" :items="[{ label: 'BCP', value: 'bcp' }, { label: 'Interbank', value: 'interbank' }]" class="w-full" /></UFormField>
        <UFormField label="N.° de operación (opcional)"><UInput v-model="form.operacion" class="w-full" /></UFormField>
        <label class="text-muted sm:col-span-2">
          Comprobante
          <div
            class="mt-1 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-default bg-default px-3 py-4 text-center text-sm text-muted"
            @click="() => { voucherInput?.click() }"
            @dragover.prevent
            @drop.prevent="onDrop"
          >
            <span>{{ photo?.name || 'Arrastra el voucher aquí o haz clic para elegir (PDF, JPG, PNG)' }}</span>
            <input ref="voucherInput" type="file" accept=".pdf,.jpg,.jpeg,.png" class="sr-only" @change="onFile">
          </div>
        </label>
      </form>
      <p v-else-if="selected" class="rounded-2xl border border-default bg-elevated p-4 text-sm text-muted">
        {{ selected.status_label }}
        <span v-if="selected.bank_label"> · {{ selected.bank_label }}</span>
        <span v-if="selected.paid_on"> · {{ selected.paid_on }}</span>
        <a v-if="selected.voucher_url" :href="selected.voucher_url" target="_blank" rel="noopener" class="mt-2 block font-semibold text-primary">Ver comprobante</a>
      </p>
      <template #footer>
        <UButton color="neutral" variant="outline" @click="() => { opened = false }">Cerrar</UButton>
        <UButton v-if="selected?.can_reject" color="error" variant="outline" @click="() => { if (selected) { const fila = selected; opened = false; startReject(fila) } }">Rechazar</UButton>
        <UButton v-if="selected?.can_approve" type="submit" form="refund-voucher" color="primary" :loading="saving">Aprobar reembolso</UButton>
      </template>
    </SupplierPaymentWindow>

    <SupplierPaymentWindow
      :open="rejecting !== null"
      title="Rechazar reembolso"
      :subtitle="rejecting ? `${rejecting.client_name || 'Cliente'} · ${rejecting.origin_label}` : ''"
      hint="Si es diferencia de cambio, vuelve a «por consultar» para que Ventas lo pida de nuevo."
      @close="rejecting = null"
    >
      <label class="block text-sm">
        <span class="mb-1 block font-semibold text-error">Motivo del rechazo</span>
        <textarea v-model="rejectReason" rows="3" class="w-full rounded-lg border border-default bg-default px-2.5 py-1.5" />
      </label>
      <template #footer>
        <UButton color="neutral" variant="outline" @click="rejecting = null">Cancelar</UButton>
        <UButton color="error" :loading="saving" @click="confirmReject">Confirmar rechazo</UButton>
      </template>
    </SupplierPaymentWindow>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import SupplierPaymentCard from '~/components/pago-proveedor/SupplierPaymentCard.vue'
import SupplierPaymentFact from '~/components/pago-proveedor/SupplierPaymentFact.vue'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'
import { useSupplierPaymentRefunds } from '~/composables/pago-proveedor/useSupplierPaymentRefunds'
import { useModal } from '~/composables/commons/useModal'
import type { SupplierPaymentRefund } from '~/types/pago-proveedor'

const props = withDefaults(defineProps<{
  embedded?: boolean
  modalOnly?: boolean
  forceBucket?: 'solicitado' | 'aprobado'
}>(), {
  embedded: false,
  modalOnly: false,
  forceBucket: undefined
})

const { showError } = useModal()
const { rows, loading, bucket, pendingCount, load, changeBucket, approve: approveRefund, reject: rejectRefund } = useSupplierPaymentRefunds()

watch(() => props.forceBucket, (next) => {
  if (next && next !== bucket.value) changeBucket(next)
}, { immediate: true })

const saving = ref(false)
const opened = ref(false)
const selected = ref<SupplierPaymentRefund | null>(null)
const rejecting = ref<SupplierPaymentRefund | null>(null)
const rejectReason = ref('')
const photo = ref<File | null>(null)
const voucherInput = ref<HTMLInputElement | null>(null)
const form = reactive({ importe: 0, fecha: '', banco: 'bcp', operacion: '' })

const money = (value: number | null) => Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const calculationLines = computed(() => {
  if (selected.value?.calculation_lines?.length) return selected.value.calculation_lines
  return (selected.value?.calculation || '').split(' · ').map((line) => line.trim()).filter(Boolean)
})

function open(row: SupplierPaymentRefund) {
  selected.value = row
  form.importe = row.amount
  form.fecha = new Date().toISOString().slice(0, 10)
  form.banco = (row.bank || '').toLowerCase().includes('inter') ? 'interbank' : 'bcp'
  form.operacion = ''
  photo.value = null
  opened.value = true
}

function onFile(event: Event) {
  photo.value = (event.target as HTMLInputElement).files?.[0] || null
}

function onDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0]
  if (file) photo.value = file
}

defineExpose({ open, startReject, load })

function startReject(row: SupplierPaymentRefund) {
  rejecting.value = row
  rejectReason.value = ''
}

async function approve() {
  if (!selected.value || !photo.value) {
    showError('Reembolso', 'Adjunta la foto del voucher.')
    return
  }
  saving.value = true
  try {
    const body = new FormData()
    body.append('importe', String(form.importe))
    body.append('fecha', form.fecha)
    body.append('banco', form.banco)
    if (form.operacion) body.append('numero_operacion', form.operacion)
    body.append('voucher', photo.value)
    await approveRefund(selected.value.id, body)
    opened.value = false
  } catch (error: any) {
    showError('Reembolso', error?.data?.message || error?.message || 'No se pudo aprobar.')
  } finally {
    saving.value = false
  }
}

async function confirmReject() {
  if (!rejecting.value) return
  if (!rejectReason.value.trim()) {
    showError('Reembolso', 'Indica el motivo del rechazo.')
    return
  }
  saving.value = true
  try {
    await rejectRefund(rejecting.value.id, rejectReason.value.trim())
    rejecting.value = null
  } catch (error: any) {
    showError('Reembolso', error?.data?.message || error?.message || 'No se pudo rechazar.')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
