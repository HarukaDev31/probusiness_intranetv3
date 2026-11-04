<template>
  <div v-if="progress" class="mt-4 space-y-3">
    <section v-if="proveedor.etapa >= 2" class="rounded-lg border border-gray-200 p-4 text-sm">
      <h3 class="font-semibold">Validación de pago</h3>
      <div class="mt-3 grid gap-3 md:grid-cols-3">
        <div class="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Abonos del cliente</p>
          <p v-if="!progress.verification.deposits.length" class="mt-2 text-gray-500">Sin abonos.</p>
          <p v-for="deposit in progress.verification.deposits" :key="deposit.id" class="mt-2 font-medium">
            ${{ money(deposit.amount) }} · {{ deposit.status_label }}
          </p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Verificación del pago</p>
          <p class="mt-2 font-medium">{{ depositSummary }}</p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Aprobación de pago</p>
          <p class="mt-2 font-medium">{{ progress.verification.approval_label }}</p>
        </div>
      </div>
    </section>

    <section v-if="progress.executions.length" class="rounded-lg border border-gray-200 p-4 text-sm">
      <h3 class="font-semibold">Ejecución de pago</h3>
      <div class="mt-3 grid gap-3 md:grid-cols-3">
        <div class="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Datos del proveedor</p>
          <p class="mt-2 font-medium">{{ proveedor.titulo || proveedor.code_supplier || 'Proveedor' }}</p>
          <p class="text-gray-500">{{ proveedor.producto || '—' }}</p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Importe pagado</p>
          <p v-for="execution in progress.executions" :key="`amt-${execution.id}`" class="mt-2 text-lg font-bold">
            ${{ money(execution.cargo_amount) }}
          </p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Registro de pago</p>
          <article v-for="execution in progress.executions" :key="execution.id" class="mt-2">
            <p>{{ execution.executed_on || 'Sin fecha' }}</p>
            <a v-if="execution.receipt_url" :href="execution.receipt_url" target="_blank" rel="noopener" class="font-semibold text-primary-600">Ver constancia</a>
            <p v-else class="text-gray-500">Constancia pendiente</p>
          </article>
        </div>
      </div>
    </section>

    <section v-if="progress.confirmation.visible" class="rounded-lg border border-gray-200 p-4 text-sm">
      <div class="flex items-center justify-between gap-3">
        <h3 class="font-semibold">Confirmación</h3>
        <span v-if="progress.confirmation.completed" class="font-semibold text-green-700">Completado</span>
        <span v-else>{{ progress.confirmation.done_count }} de {{ progress.confirmation.total }}</span>
      </div>
      <div class="mt-3 grid gap-3 md:grid-cols-3">
        <div class="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Resumen de la operación</p>
          <ul class="mt-2 space-y-1">
            <li v-for="item in summaryItems" :key="item.key" class="flex items-center gap-2">
              <span class="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold" :class="item.done ? 'bg-green-600 text-white' : 'border border-gray-200 bg-white text-gray-400'">{{ item.done ? '✓' : '' }}</span>
              <span :class="item.done ? 'text-gray-700' : 'text-gray-500'">{{ item.label }}</span>
            </li>
          </ul>
        </div>
        <div class="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Información al cliente</p>
          <ul class="mt-2 space-y-1">
            <li v-for="item in clientItems" :key="item.key" class="flex items-center gap-2">
              <span class="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold" :class="item.done ? 'bg-green-600 text-white' : 'border border-gray-200 bg-white text-gray-400'">{{ item.done ? '✓' : '' }}</span>
              <span :class="item.done ? 'text-gray-700' : 'text-gray-500'">{{ item.label }}</span>
            </li>
            <li v-if="!clientItems.length" class="text-gray-400">Sin avisos pendientes.</li>
          </ul>
        </div>
        <div class="rounded-xl border border-orange-100 bg-primary-50 p-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-primary-700">Por resolver</p>
          <ul class="mt-2 space-y-1">
            <li v-for="item in pendingItems" :key="item.key" class="flex items-center gap-2">
              <span class="flex h-5 w-5 items-center justify-center rounded-full border border-orange-200 bg-white text-[11px] font-bold text-orange-500" />
              <span class="font-semibold text-gray-900">{{ item.label }}</span>
            </li>
            <li v-if="!pendingItems.length" class="text-gray-500">Nada pendiente.</li>
          </ul>
        </div>
      </div>
      <p v-if="!progress.confirmation.completed && progress.confirmation.missing.length" class="mt-2 text-gray-600">
        Falta: {{ progress.confirmation.missing.join(', ') }}
      </p>

      <div
        v-if="pendingRefund"
        class="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p class="font-semibold text-amber-950">Reembolso</p>
            <p class="mt-0.5 text-amber-900">
              Lo aprueba Administración<span v-if="pendingRefund.blocks_close"> · frena el cierre</span>
            </p>
            <p class="mt-1 text-xs text-amber-800">{{ pendingRefund.origin_label }}</p>
          </div>
          <span class="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-amber-900">
            {{ pendingRefund.status_label }} ${{ money(pendingRefund.amount) }}
          </span>
        </div>
      </div>

      <p v-if="progress.confirmation.can_decide_installment" class="mt-2" :class="progress.confirmation.decision_overdue ? 'font-semibold text-red-600' : 'text-gray-500'">
        {{ deadlineText }}
      </p>
      <div v-if="progress.confirmation.can_decide_installment" class="mt-3 flex flex-wrap gap-2">
        <UButton size="sm" color="primary" :loading="saving" @click="choose(INSTALLMENT_CHOICE.PROCEED)">Se realizará</UButton>
        <UButton size="sm" color="neutral" variant="soft" :loading="saving" @click="choose(INSTALLMENT_CHOICE.CANCEL)">No se realizará</UButton>
      </div>
      <p v-else-if="progress.confirmation.second_installment_choice === INSTALLMENT_CHOICE.PROCEED" class="mt-2 text-gray-600">La cuota 2 se va a realizar.</p>
      <p v-else-if="progress.confirmation.second_installment_choice === INSTALLMENT_CHOICE.CANCEL" class="mt-2 text-gray-600">La cuota 2 no se realizará. No se cobra su comisión ni el segundo abono.</p>
      <div v-if="progress.confirmation.can_decide_payment" class="mt-3 space-y-3">
        <p class="text-sm text-gray-600">
          Pago 2 de 2 · ¿Se va a realizar?
          <span v-if="deadlineText" :class="progress.confirmation.decision_overdue ? 'font-semibold text-red-600' : 'text-amber-800'"> · {{ deadlineText }}</span>
        </p>
        <div class="flex flex-wrap gap-2">
          <UButton size="sm" color="primary" :loading="saving" @click="choosePayment(PAYMENT_CHOICE.PROCEED)">Se realizará</UButton>
          <UButton size="sm" color="neutral" variant="soft" :loading="saving" @click="showCancelPayment = true">No se realizará</UButton>
        </div>
        <div v-if="showCancelPayment" class="rounded-xl border border-red-100 bg-red-50 p-3">
          <p class="font-semibold text-red-800">Pago 2 de 2: no se realizará</p>
          <p v-if="progress.confirmation.payment_two_refund" class="mt-2 text-sm text-red-900">
            Carga del pago 2 ${{ money(progress.confirmation.payment_two_refund.cargo) }}
            · Comisión administrativa ${{ money(progress.confirmation.payment_two_refund.admin) }}
            · Total a devolver ${{ money(progress.confirmation.payment_two_refund.total) }}.
          </p>
          <p class="mt-1 text-xs text-red-700">La comisión bancaria no se devuelve: el envío a China ya se hizo.</p>
          <input v-model="paymentReason" placeholder="Motivo" class="mt-2 w-full rounded-md border border-red-200 px-2 py-1.5" />
          <div class="mt-2 flex flex-wrap gap-2">
            <UButton size="sm" color="neutral" variant="soft" :loading="saving" @click="choosePayment(PAYMENT_CHOICE.CANCEL)">Solo anular</UButton>
            <UButton size="sm" color="error" variant="soft" :loading="saving" @click="choosePayment(PAYMENT_CHOICE.REFUND)">Anular y solicitar reembolso</UButton>
          </div>
        </div>
      </div>
      <p v-else-if="progress.confirmation.second_payment_choice === PAYMENT_CHOICE.PROCEED" class="mt-2 text-gray-600">El pago 2 vuelve a ejecución.</p>
      <div v-if="progress.confirmation.can_request_refund" class="mt-3">
        <UButton size="sm" color="primary" :loading="saving" @click="requestRefund">Solicitar reembolso</UButton>
      </div>
      <div v-if="progress.confirmation.can_send_balance || progress.confirmation.can_download_balance" class="mt-3 flex flex-wrap gap-2">
        <UButton v-if="progress.confirmation.can_send_balance" size="sm" color="primary" variant="soft" :loading="saving" @click="sendBalance">Enviar balance al cliente</UButton>
        <UButton v-if="progress.confirmation.can_download_balance" size="sm" color="neutral" variant="soft" :loading="saving" @click="downloadBalance">Descargar balance PDF</UButton>
      </div>
      <form v-if="progress.confirmation.can_register_exchange" class="mt-3 space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3" @submit.prevent="saveDifference">
        <p class="font-semibold text-amber-900">Diferencia por cobrar ${{ money(progress.confirmation.exchange_due_usd) }}. Administración la valida en Verificación.</p>
        <div class="flex flex-wrap items-end gap-2">
          <label>Importe
            <input v-model.number="difference.importe" type="number" min="0" step="0.01" class="mt-1 block rounded-md border border-gray-300 px-2 py-1.5" />
          </label>
          <label>Fecha
            <input v-model="difference.fecha" type="date" class="mt-1 block rounded-md border border-gray-300 px-2 py-1.5" />
          </label>
          <label>Banco
            <select v-model="difference.banco" class="mt-1 block rounded-md border border-gray-300 px-2 py-1.5">
              <option value="bcp">BCP</option>
              <option value="interbank">Interbank</option>
            </select>
          </label>
          <label>N.° de operación
            <input v-model="difference.operacion" class="mt-1 block rounded-md border border-gray-300 px-2 py-1.5" />
          </label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" @change="onDifferenceFile" />
          <UButton type="submit" size="sm" color="primary" :loading="saving">Registrar voucher</UButton>
        </div>
      </form>
      <form v-if="progress.confirmation.exchange_rate_pending" class="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-primary-100 bg-primary-50 p-3" @submit.prevent="saveRate">
        <label class="text-sm">Tipo de cambio del día
          <input v-model.number="rate" type="number" min="0" step="0.0001" class="mt-1 block rounded-md border border-gray-300 px-2 py-1.5" />
        </label>
        <UButton type="submit" size="sm" color="primary" :loading="saving">Confirmar tipo de cambio</UButton>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { INSTALLMENT_CHOICE, PAYMENT_CHOICE } from '~/constants/supplierPayment'
import type { PagoProveedorSolicitudProveedor } from '~/types/pago-proveedor'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useSupplierPaymentProgress } from '~/composables/pago-proveedor/useSupplierPaymentProgress'

const props = defineProps<{ solicitudId: number; proveedor: PagoProveedorSolicitudProveedor }>()
const emit = defineEmits<{ saved: [] }>()
const { showError, showSuccess } = useModal()
const { withSpinner } = useSpinner()
const api = useSupplierPaymentProgress()
const saving = ref(false)
const showCancelPayment = ref(false)
const rate = ref<number | null>(null)
const paymentReason = ref('')
const differenceFile = ref<File | null>(null)
const difference = reactive({ importe: null as number | null, fecha: '', banco: 'bcp', operacion: '' })
const progress = computed(() => props.proveedor.progreso)
const pendingRefund = computed(() => progress.value?.confirmation.pending_refund || null)

const depositSummary = computed(() => {
  const deposits = progress.value?.verification.deposits || []
  if (!deposits.length) return 'Sin depósitos'
  const pending = deposits.filter((deposit) => deposit.status === 'en_validacion').length
  if (pending) return `${pending} por validar`
  return 'Depósitos revisados'
})

const summaryItems = computed(() => (progress.value?.confirmation.items || []).filter((item) => ['payment', 'receipt'].includes(item.key)))
const clientItems = computed(() => (progress.value?.confirmation.items || []).filter((item) => ['client_notice', 'exchange'].includes(item.key)))
const pendingItems = computed(() => (progress.value?.confirmation.items || []).filter((item) => !item.done && item.blocks))

const deadlineText = computed(() => {
  const confirmation = progress.value?.confirmation
  if (!confirmation) return ''
  if (confirmation.decision_due_text) return confirmation.decision_due_text
  if (!confirmation.decision_due_at) return 'Plazo de 72 h para decidir.'
  return confirmation.decision_overdue ? 'El plazo ya venció. Igual puedes elegir.' : 'Tienes plazo para decidir.'
})

function money(value: number) {
  return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function choose(choice: string) {
  saving.value = true
  try {
    await withSpinner(() => api.decideInstallment(props.solicitudId, props.proveedor.id, choice), 'Guardando…')
    showSuccess('Cuota 2', choice === INSTALLMENT_CHOICE.PROCEED ? 'La cuota 2 vuelve a etapa 1.' : 'La cuota 2 no se cobrará.')
    emit('saved')
  } catch (error: any) {
    showError('Cuota 2', error?.data?.message || 'No se pudo guardar la decisión.')
  } finally {
    saving.value = false
  }
}

async function choosePayment(choice: string) {
  if (choice !== PAYMENT_CHOICE.PROCEED && !paymentReason.value.trim()) return
  saving.value = true
  try {
    await withSpinner(() => api.decidePayment(props.solicitudId, props.proveedor.id, choice, paymentReason.value), 'Guardando…')
    showCancelPayment.value = false
    showSuccess('Pago 2', choice === PAYMENT_CHOICE.PROCEED ? 'China puede registrar el segundo pago.' : 'El pago 2 no se realizará.')
    emit('saved')
  } catch (error: any) {
    showError('Pago 2', error?.data?.message || 'No se pudo guardar la decisión.')
  } finally {
    saving.value = false
  }
}

function onDifferenceFile(event: Event) {
  const input = event.target as HTMLInputElement
  differenceFile.value = input.files?.[0] || null
}

function savePdf(pdf?: { filename: string; base64: string } | null) {
  if (!pdf?.base64) return
  const link = document.createElement('a')
  link.href = `data:application/pdf;base64,${pdf.base64}`
  link.download = pdf.filename || 'Balance.pdf'
  link.click()
}

async function sendBalance() {
  saving.value = true
  try {
    const response = await withSpinner(() => api.sendBalance(props.solicitudId, props.proveedor.id), 'Generando balance…')
    savePdf(response.pdf)
    showSuccess('Balance', 'El mensaje y el PDF quedaron listos para el cliente.')
    emit('saved')
  } catch (error: any) {
    showError('Balance', error?.data?.message || 'No se pudo enviar el balance.')
  } finally {
    saving.value = false
  }
}

async function downloadBalance() {
  saving.value = true
  try {
    const response = await withSpinner(() => api.downloadBalance(props.solicitudId, props.proveedor.id), 'Descargando…')
    savePdf(response.data)
    showSuccess('Balance', 'PDF descargado.')
  } catch (error: any) {
    showError('Balance', error?.data?.message || 'No se pudo descargar el balance.')
  } finally {
    saving.value = false
  }
}

async function saveDifference() {
  if (!difference.importe || !difference.fecha || !difference.operacion || !differenceFile.value) return
  const form = new FormData()
  form.append('importe', String(difference.importe))
  form.append('fecha', difference.fecha)
  form.append('banco', difference.banco)
  form.append('numero_operacion', difference.operacion)
  form.append('voucher', differenceFile.value)
  saving.value = true
  try {
    await withSpinner(() => api.registerDifference(props.solicitudId, props.proveedor.id, form), 'Registrando…')
    showSuccess('Diferencia de cambio', 'El voucher quedó para que Administración lo valide.')
    emit('saved')
  } catch (error: any) {
    showError('Diferencia de cambio', error?.data?.message || 'No se pudo registrar el voucher.')
  } finally {
    saving.value = false
  }
}

async function requestRefund() {
  saving.value = true
  try {
    await withSpinner(() => api.requestRefund(props.solicitudId, props.proveedor.id), 'Solicitando…')
    showSuccess('Reembolso', 'Administración ya puede registrar el voucher.')
    emit('saved')
  } catch (error: any) {
    showError('Reembolso', error?.data?.message || 'No se pudo solicitar el reembolso.')
  } finally {
    saving.value = false
  }
}

async function saveRate() {
  if (!rate.value || rate.value <= 0) return
  saving.value = true
  try {
    await withSpinner(() => api.confirmRate(props.solicitudId, rate.value!), 'Confirmando…')
    showSuccess('Tipo de cambio', 'Ya puedes registrar el abono de la cuota 2.')
    emit('saved')
  } catch (error: any) {
    showError('Tipo de cambio', error?.data?.message || 'No se pudo confirmar el tipo de cambio.')
  } finally {
    saving.value = false
  }
}
</script>
