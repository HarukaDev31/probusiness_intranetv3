<template>
  <div>
    <p class="mb-3 text-sm text-gray-500">El dinero sale fuera de la intranet. Aquí solo apruebas el reembolso y dejas el voucher.</p>
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
            <td colspan="6" class="px-3.5 py-8 text-center text-gray-400">No hay reembolsos solicitados.</td>
          </tr>
          <template v-else>
          <tr v-for="row in rows" :key="row.id" class="border-t border-gray-100">
            <td class="px-3.5 py-3 font-semibold">{{ row.origin_label }}</td>
            <td class="px-3.5 py-3">{{ row.client_name || '—' }}<div class="text-xs text-gray-400">{{ row.consolidation }}</div></td>
            <td class="px-3.5 py-3">{{ row.supplier_code || '—' }}</td>
            <td class="px-3.5 py-3 text-gray-600">{{ row.calculation }}</td>
            <td class="px-3.5 py-3 font-semibold">${{ money(row.amount) }}</td>
            <td class="px-3.5 py-3 text-right">
              <div v-if="row.can_approve" class="flex justify-end gap-2">
                <UButton size="sm" color="primary" @click="open(row)">Aprobar</UButton>
                <UButton size="sm" color="neutral" variant="outline" @click="reject(row)">Rechazar</UButton>
              </div>
              <span v-else class="rounded bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-600">{{ row.status_label }}</span>
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
        </SupplierPaymentCard>
        <SupplierPaymentCard title="Reembolso">
          <p class="text-3xl font-bold text-primary-700">${{ money(selected.amount) }}</p>
          <p v-if="selected.reason" class="text-sm text-gray-600">{{ selected.reason }}</p>
        </SupplierPaymentCard>
        <SupplierPaymentCard title="Cómo se calcula">
          <p class="text-sm text-gray-700">{{ selected.calculation }}</p>
        </SupplierPaymentCard>
      </div>
      <form id="refund-voucher" class="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm sm:grid-cols-2" @submit.prevent="approve">
        <h4 class="text-[15px] font-bold text-gray-900 sm:col-span-2">Voucher del reembolso</h4>
        <label class="text-gray-500">Importe
          <input v-model.number="form.importe" type="number" min="0" step="0.01" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" />
        </label>
        <label class="text-gray-500">Fecha
          <input v-model="form.fecha" type="date" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" />
        </label>
        <label class="text-gray-500">Banco
          <select v-model="form.banco" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900">
            <option value="bcp">BCP</option>
            <option value="interbank">Interbank</option>
          </select>
        </label>
        <label class="text-gray-500">N.° de operación (opcional)
          <input v-model="form.operacion" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" />
        </label>
        <label class="text-gray-500 sm:col-span-2">Comprobante
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" class="mt-1 block text-gray-800" @change="onFile" />
        </label>
      </form>
      <template #footer>
        <UButton type="submit" form="refund-voucher" color="primary" :loading="saving">Registrar voucher</UButton>
      </template>
    </SupplierPaymentWindow>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import SupplierPaymentCard from '~/components/pago-proveedor/SupplierPaymentCard.vue'
import SupplierPaymentFact from '~/components/pago-proveedor/SupplierPaymentFact.vue'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'
import { useModal } from '~/composables/commons/useModal'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import type { SupplierPaymentRefund } from '~/types/pago-proveedor'

const { showSuccess, showError } = useModal()
const rows = ref<SupplierPaymentRefund[]>([])
const loading = ref(false)
const saving = ref(false)
const opened = ref(false)
const selected = ref<SupplierPaymentRefund | null>(null)
const photo = ref<File | null>(null)
const form = reactive({ importe: 0, fecha: '', banco: 'bcp', operacion: '' })

const money = (value: number | null) => Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const load = async () => {
  loading.value = true
  try {
    const response = await PagoProveedorService.listRefunds({ status: 'solicitado', per_page: 50 })
    rows.value = response?.data || []
  } catch (error: any) {
    showError('Reembolsos', error?.data?.message || 'No se pudo cargar.')
  } finally {
    loading.value = false
  }
}

const open = (row: SupplierPaymentRefund) => {
  selected.value = row
  form.importe = row.amount
  form.fecha = new Date().toISOString().slice(0, 10)
  form.banco = 'bcp'
  form.operacion = ''
  photo.value = null
  opened.value = true
}

const onFile = (event: Event) => {
  photo.value = (event.target as HTMLInputElement).files?.[0] || null
}

const approve = async () => {
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
    await PagoProveedorService.approveRefund(selected.value.id, body)
    opened.value = false
    showSuccess('Reembolso', 'El voucher quedó registrado.')
    await load()
  } catch (error: any) {
    showError('Reembolso', error?.data?.message || 'No se pudo aprobar.')
  } finally {
    saving.value = false
  }
}

const reject = async (row: SupplierPaymentRefund) => {
  const reason = window.prompt('Motivo del rechazo')
  if (!reason) return
  try {
    await PagoProveedorService.rejectRefund(row.id, reason)
    showSuccess('Reembolso', 'El reembolso quedó rechazado.')
    await load()
  } catch (error: any) {
    showError('Reembolso', error?.data?.message || 'No se pudo rechazar.')
  }
}

onMounted(load)
</script>
