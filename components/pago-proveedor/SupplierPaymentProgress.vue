<template>
  <div v-if="progress" class="mt-4 space-y-3">
    <section v-if="proveedor.etapa >= 2" class="rounded-lg border border-gray-200 p-4 text-sm">
      <h3 class="font-semibold">Validación de pago</h3>
      <div class="mt-3 grid gap-3 md:grid-cols-3">
        <div>
          <p class="text-xs uppercase tracking-wide text-gray-500">Abonos del cliente</p>
          <p v-if="!progress.verification.deposits.length" class="mt-1 text-gray-500">Sin abonos.</p>
          <p v-for="deposit in progress.verification.deposits" :key="deposit.id" class="mt-1">
            ${{ money(deposit.amount) }} · {{ deposit.status_label }}
          </p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wide text-gray-500">Verificación</p>
          <p class="mt-1">{{ depositSummary }}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wide text-gray-500">Aprobación</p>
          <p class="mt-1">{{ progress.verification.approval_label }}</p>
        </div>
      </div>
    </section>

    <section v-if="progress.executions.length" class="rounded-lg border border-gray-200 p-4 text-sm">
      <h3 class="font-semibold">Ejecución de pago</h3>
      <article v-for="execution in progress.executions" :key="execution.id" class="mt-2 flex items-center justify-between gap-3">
        <p>Pagado ${{ money(execution.cargo_amount) }} <span v-if="execution.executed_on">· {{ execution.executed_on }}</span></p>
        <a v-if="execution.receipt_url" :href="execution.receipt_url" target="_blank" rel="noopener" class="text-primary-600">Ver constancia</a>
      </article>
      <p class="mt-2 text-gray-500">Constancia registrada. El aviso al cliente por WhatsApp queda para el final.</p>
    </section>

    <section v-if="progress.confirmation.visible" class="rounded-lg border border-gray-200 p-4 text-sm">
      <div class="flex items-center justify-between gap-3">
        <h3 class="font-semibold">Confirmación</h3>
        <span v-if="progress.confirmation.completed" class="font-semibold text-green-700">Completado</span>
        <span v-else>{{ progress.confirmation.done_count }} de {{ progress.confirmation.total }}</span>
      </div>
      <ul class="mt-3 space-y-1">
        <li
          v-for="item in progress.confirmation.items"
          :key="item.key"
          class="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm"
          :class="!item.done && item.blocks ? 'border border-orange-200 bg-primary-50' : ''"
        >
          <span
            class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
            :class="item.done ? 'bg-green-600 text-white' : 'border border-gray-200 bg-white text-gray-400'"
          >{{ item.done ? '✓' : '' }}</span>
          <span :class="item.done ? 'text-gray-700' : (item.blocks ? 'font-semibold text-gray-900' : 'text-gray-500')">{{ item.label }}</span>
        </li>
      </ul>
      <p v-if="!progress.confirmation.completed && progress.confirmation.missing.length" class="mt-2 text-gray-600">
        Falta: {{ progress.confirmation.missing.join(', ') }}
      </p>
      <p v-if="progress.confirmation.can_decide_installment" class="mt-2" :class="progress.confirmation.decision_overdue ? 'font-semibold text-red-600' : 'text-gray-500'">
        {{ deadlineText }}
      </p>
      <div v-if="progress.confirmation.can_decide_installment" class="mt-3 flex flex-wrap gap-2">
        <UButton size="sm" color="primary" :loading="saving" @click="choose(INSTALLMENT_CHOICE.PROCEED)">La cuota 2 se realizará</UButton>
        <UButton size="sm" color="neutral" variant="soft" :loading="saving" @click="choose(INSTALLMENT_CHOICE.CANCEL)">No se realizará</UButton>
      </div>
      <p v-else-if="progress.confirmation.second_installment_choice === INSTALLMENT_CHOICE.PROCEED" class="mt-2 text-gray-600">La cuota 2 se va a realizar.</p>
      <p v-else-if="progress.confirmation.second_installment_choice === INSTALLMENT_CHOICE.CANCEL" class="mt-2 text-gray-600">La cuota 2 no se realizará. No se cobra su comisión ni el segundo abono.</p>
      <div v-if="progress.confirmation.can_decide_payment" class="mt-3 space-y-2">
        <UButton size="sm" color="primary" :loading="saving" @click="choosePayment(PAYMENT_CHOICE.PROCEED)">El pago 2 se realizará</UButton>
        <div class="flex flex-wrap items-end gap-2">
          <input v-model="paymentReason" placeholder="Motivo si no se realizará" class="rounded-md border border-gray-300 px-2 py-1.5" />
          <UButton size="sm" color="neutral" variant="soft" :loading="saving" @click="choosePayment(PAYMENT_CHOICE.CANCEL)">Solo anular</UButton>
          <UButton size="sm" color="neutral" variant="soft" :loading="saving" @click="choosePayment(PAYMENT_CHOICE.REFUND)">Anular y solicitar reembolso</UButton>
        </div>
      </div>
      <p v-else-if="progress.confirmation.second_payment_choice === PAYMENT_CHOICE.PROCEED" class="mt-2 text-gray-600">El pago 2 vuelve a ejecución.</p>
      <p v-else-if="progress.confirmation.second_payment_choice === PAYMENT_CHOICE.REFUND" class="mt-2 text-gray-600">El pago 2 no se realizará. El reembolso queda pendiente de Administración.</p>
      <div v-if="progress.confirmation.can_request_refund" class="mt-3">
        <UButton size="sm" color="primary" :loading="saving" @click="requestRefund">Solicitar reembolso</UButton>
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
import { PagoProveedorService } from '~/services/pagoProveedorService'
import type { PagoProveedorSolicitudProveedor } from '~/types/pago-proveedor'
import { useModal } from '~/composables/commons/useModal'

const props = defineProps<{ solicitudId: number; proveedor: PagoProveedorSolicitudProveedor }>()
const emit = defineEmits<{ saved: [] }>()
const { showError, showSuccess } = useModal()
const saving = ref(false)
const rate = ref<number | null>(null)
const paymentReason = ref('')
const differenceFile = ref<File | null>(null)
const difference = reactive({ importe: null as number | null, fecha: '', banco: 'bcp', operacion: '' })
const progress = computed(() => props.proveedor.progreso)

const depositSummary = computed(() => {
  const deposits = progress.value?.verification.deposits || []
  if (!deposits.length) return 'Sin depósitos'
  const pending = deposits.filter((deposit) => deposit.status === 'en_validacion').length
  if (pending) return `${pending} por validar`
  return 'Depósitos revisados'
})

const deadlineText = computed(() => {
  const confirmation = progress.value?.confirmation
  if (!confirmation?.decision_due_at) return 'Plazo de 72 h para decidir la cuota 2.'
  return confirmation.decision_overdue ? 'El plazo para decidir la cuota 2 ya venció. Igual puedes elegir.' : 'Tienes plazo para decidir la cuota 2.'
})

function money(value: number) {
  return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function choose(choice: string) {
  saving.value = true
  try {
    await PagoProveedorService.decidirCuota(props.solicitudId, props.proveedor.id, choice)
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
    await PagoProveedorService.decidirPago2(props.solicitudId, props.proveedor.id, choice, paymentReason.value)
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
    await PagoProveedorService.registrarDiferencia(props.solicitudId, props.proveedor.id, form)
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
    await PagoProveedorService.solicitarReembolso(props.solicitudId, props.proveedor.id)
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
    await PagoProveedorService.confirmarTipoCambio(props.solicitudId, rate.value)
    showSuccess('Tipo de cambio', 'Ya puedes registrar el abono de la cuota 2.')
    emit('saved')
  } catch (error: any) {
    showError('Tipo de cambio', error?.data?.message || 'No se pudo confirmar el tipo de cambio.')
  } finally {
    saving.value = false
  }
}
</script>
