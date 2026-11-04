<template>
  <div>
    <p class="mb-3 text-sm text-gray-500">El dinero sale fuera de la intranet. Aquí solo apruebas el reembolso y dejas el voucher.</p>
    <div class="mb-3 flex flex-wrap gap-2">
      <button
        type="button"
        class="rounded-lg px-3 py-1.5 text-sm font-semibold"
        :class="bucket === 'solicitado' ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-600'"
        @click="changeBucket('solicitado')"
      >
        Solicitados<span v-if="pendingCount" class="ml-1 text-xs">({{ pendingCount }})</span>
      </button>
      <button
        type="button"
        class="rounded-lg px-3 py-1.5 text-sm font-semibold"
        :class="bucket === 'aprobado' ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-600'"
        @click="changeBucket('aprobado')"
      >
        Aprobados
      </button>
    </div>
    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
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
            <td colspan="6" class="px-3.5 py-8 text-center text-gray-400">
              {{ bucket === 'solicitado' ? 'No hay reembolsos solicitados.' : 'No hay reembolsos aprobados.' }}
            </td>
          </tr>
          <template v-else>
            <tr v-for="row in rows" :key="row.id" class="border-t border-gray-100">
              <td class="px-3.5 py-3 font-semibold">{{ row.origin_label }}</td>
              <td class="px-3.5 py-3">
                {{ row.client_name || '—' }}
                <div class="text-xs text-gray-400">{{ row.consolidation }}</div>
              </td>
              <td class="px-3.5 py-3">{{ row.supplier_code || '—' }}</td>
              <td class="px-3.5 py-3 text-gray-600">
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
                  <span class="rounded bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-600">{{ row.status_label }}</span>
                  <div v-if="row.voucher_url" class="text-xs">
                    <a :href="row.voucher_url" target="_blank" rel="noopener" class="font-semibold text-primary-600">Ver voucher</a>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <SupplierPaymentWindow
      :open="opened"
      title="Aprobar reembolso"
      :subtitle="selected ? `${selected.client_name || 'Cliente'} · ${selected.consolidation || 'Sin consolidado'}` : ''"
      hint="El reembolso se hace fuera de la intranet: al aprobarlo, registras su voucher."
      wide
      @close="opened = false"
    >
      <div v-if="selected" class="grid gap-4 lg:grid-cols-3">
        <SupplierPaymentCard title="Solicitud">
          <SupplierPaymentFact label="Cliente" :value="selected.client_name || '—'" />
          <SupplierPaymentFact label="Consolidado" :value="selected.consolidation || '—'" />
          <SupplierPaymentFact label="Proveedor" :value="selected.supplier_code || '—'" />
          <SupplierPaymentFact label="Origen" :value="selected.origin_label" />
          <SupplierPaymentFact
            v-if="selected.requested_at"
            label="Solicitado"
            :value="new Date(selected.requested_at).toLocaleString('es-PE')"
          />
        </SupplierPaymentCard>
        <SupplierPaymentCard title="Reembolso">
          <p class="text-3xl font-bold text-primary-700">${{ money(selected.amount) }}</p>
          <p v-if="selected.reason" class="text-sm text-gray-600">{{ selected.reason }}</p>
        </SupplierPaymentCard>
        <SupplierPaymentCard title="Cómo se calcula">
          <ul class="space-y-1 text-sm text-gray-700">
            <li v-for="(line, index) in calculationLines" :key="index">{{ line }}</li>
          </ul>
          <p class="mt-2 text-xs text-gray-500">Total ${{ money(selected.amount) }}</p>
        </SupplierPaymentCard>
      </div>
      <form id="refund-voucher" class="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm sm:grid-cols-2" @submit.prevent="approve">
        <h4 class="text-[15px] font-bold text-gray-900 sm:col-span-2">Voucher del reembolso</h4>
        <label class="text-gray-500">Importe
          <input v-model.number="form.importe" type="number" min="0" step="0.01" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900">
        </label>
        <label class="text-gray-500">Fecha
          <input v-model="form.fecha" type="date" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900">
        </label>
        <label class="text-gray-500">Banco
          <select v-model="form.banco" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900">
            <option value="bcp">BCP</option>
            <option value="interbank">Interbank</option>
          </select>
        </label>
        <label class="text-gray-500">N.° de operación (opcional)
          <input v-model="form.operacion" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900">
        </label>
        <label class="text-gray-500 sm:col-span-2">Comprobante
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" class="mt-1 block text-gray-800" @change="onFile">
        </label>
      </form>
      <template #footer>
        <UButton type="submit" form="refund-voucher" color="primary" :loading="saving">Registrar voucher</UButton>
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
        <span class="mb-1 block font-semibold text-red-700">Motivo del rechazo</span>
        <textarea v-model="rejectReason" rows="3" class="w-full rounded-lg border border-gray-300 px-2.5 py-1.5" />
      </label>
      <template #footer>
        <UButton color="error" :loading="saving" @click="confirmReject">Confirmar rechazo</UButton>
      </template>
    </SupplierPaymentWindow>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import SupplierPaymentCard from '~/components/pago-proveedor/SupplierPaymentCard.vue'
import SupplierPaymentFact from '~/components/pago-proveedor/SupplierPaymentFact.vue'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'
import { useSupplierPaymentRefunds } from '~/composables/pago-proveedor/useSupplierPaymentRefunds'
import { useModal } from '~/composables/commons/useModal'
import type { SupplierPaymentRefund } from '~/types/pago-proveedor'

const { showError } = useModal()
const { rows, loading, bucket, pendingCount, load, changeBucket, approve: approveRefund, reject: rejectRefund } = useSupplierPaymentRefunds()

const saving = ref(false)
const opened = ref(false)
const selected = ref<SupplierPaymentRefund | null>(null)
const rejecting = ref<SupplierPaymentRefund | null>(null)
const rejectReason = ref('')
const photo = ref<File | null>(null)
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
  form.banco = 'bcp'
  form.operacion = ''
  photo.value = null
  opened.value = true
}

function onFile(event: Event) {
  photo.value = (event.target as HTMLInputElement).files?.[0] || null
}

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
