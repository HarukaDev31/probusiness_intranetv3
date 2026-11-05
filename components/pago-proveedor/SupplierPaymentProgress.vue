<template>
  <div v-if="progress" class="mt-4 space-y-3">
    <UCard v-if="!readonly && progress.confirmation.exchange_rate_pending" color="primary" variant="subtle">
      <p class="mb-2 text-sm font-semibold text-highlighted">Cuota 2: confirma el tipo de cambio del día para cobrarla.</p>
      <form class="flex flex-wrap items-end gap-2" @submit.prevent="saveRate">
        <UFormField label="Tipo de cambio del día">
          <UInput v-model.number="rate" type="number" min="0" step="0.0001" class="w-32" />
        </UFormField>
        <UButton type="submit" size="sm" color="primary" :loading="saving">Confirmar tipo de cambio</UButton>
      </form>
    </UCard>
    <UCard v-if="muestraValidacion" class="text-sm">
      <h3 class="font-semibold">Validación de pago</h3>
      <div class="mt-3 grid gap-3 md:grid-cols-3">
        <UCard variant="subtle">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">Abonos del cliente</p>
          <p v-if="!progress.verification.deposits.length" class="mt-2 text-muted">Sin abonos.</p>
          <p v-for="deposit in progress.verification.deposits" :key="deposit.id" class="mt-2 font-medium">
            ${{ money(deposit.amount) }} · {{ deposit.status_label }}
          </p>
        </UCard>
        <UCard variant="subtle">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">Verificación del pago</p>
          <p class="mt-2 font-medium">{{ depositSummary }}</p>
        </UCard>
        <UCard variant="subtle">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">Aprobación de pago</p>
          <p class="mt-2 font-medium">{{ progress.verification.approval_label }}</p>
        </UCard>
      </div>
      <UCard
        v-if="needsProviderData"
        class="mt-3"
        color="warning"
        variant="subtle"
      >
        <p class="font-semibold">Depósitos validados. Faltan los datos del proveedor.</p>
        <p class="mt-1 text-sm text-muted">Sin ellos el pago no puede pasar a Ejecución.</p>
        <UButton
          v-if="!readonly"
          class="mt-2"
          size="sm"
          color="primary"
          @click="emit('complete-data')"
        >
          Completar datos
        </UButton>
      </UCard>
    </UCard>

    <UCard v-if="muestraEjecucion" class="text-sm">
      <h3 class="font-semibold">Ejecución de pago</h3>
      <div class="mt-3 grid gap-3 md:grid-cols-3">
        <UCard variant="subtle">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">Datos del proveedor</p>
          <p class="mt-2 font-medium">{{ proveedor.titulo || proveedor.code_supplier || 'Proveedor' }}</p>
          <p class="text-muted">{{ proveedor.producto || '—' }}</p>
          <UButton
            v-if="!readonly && needsProviderData"
            class="mt-2"
            size="sm"
            color="primary"
            variant="soft"
            @click="emit('complete-data')"
          >
            Completar datos
          </UButton>
        </UCard>
        <UCard variant="subtle">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">
            {{ hasPaidExecution ? 'Importe pagado' : 'Importe a pagar' }}
          </p>
          <template v-if="progress.executions.length">
            <p v-for="execution in progress.executions" :key="`amt-${execution.id}`" class="mt-2 text-lg font-bold">
              ${{ money(execution.cargo_amount) }}
            </p>
          </template>
          <p v-else class="mt-2 text-lg font-bold">${{ money(proveedor.valor_carga_usd) }}</p>
        </UCard>
        <UCard variant="subtle">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">Registro de pago</p>
          <article v-for="execution in progress.executions" :key="execution.id" class="mt-2">
            <p>{{ execution.executed_on || 'Sin fecha' }}</p>
            <a v-if="execution.receipt_url" :href="execution.receipt_url" target="_blank" rel="noopener" class="font-semibold text-primary">Ver constancia</a>
            <p v-else class="text-muted">Constancia pendiente</p>
          </article>
        </UCard>
      </div>
    </UCard>

    <UCard v-if="muestraConfirmacion" class="text-sm">
      <div class="flex items-center justify-between gap-3">
        <h3 class="font-semibold">Confirmación</h3>
        <span v-if="progress.confirmation.completed" class="font-semibold text-success">Completado</span>
        <span v-else>{{ progress.confirmation.done_count }} de {{ progress.confirmation.total }}</span>
      </div>
      <div class="mt-3 grid gap-3 md:grid-cols-3">
        <UCard variant="subtle">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">Resumen de la operación</p>
          <dl class="mt-2 space-y-1">
            <div class="flex justify-between gap-2"><dt class="text-muted">Monto total</dt><dd class="font-semibold text-highlighted">${{ money(proveedor.total_monto) }}</dd></div>
            <div class="flex justify-between gap-2"><dt class="text-muted">Abono del cliente</dt><dd class="font-semibold text-highlighted">${{ money(proveedor.importe_abonado) }}</dd></div>
            <div v-for="execution in progress.executions" :key="`paid-${execution.id}`" class="flex justify-between gap-2"><dt class="text-muted">Pago al proveedor</dt><dd class="font-semibold text-highlighted">${{ money(execution.cargo_amount) }}</dd></div>
          </dl>
          <a v-if="proveedor.proforma_url" :href="proveedor.proforma_url" target="_blank" rel="noopener" class="mt-2 inline-block text-sm font-semibold text-primary">Ver proforma</a>
          <ul class="mt-2 space-y-1">
            <li v-for="item in summaryItems" :key="item.key" class="flex items-center gap-2">
              <UIcon :name="item.done ? 'i-lucide-circle-check' : 'i-lucide-circle'" :class="item.done ? 'text-success' : 'text-muted'" class="size-4 shrink-0" />
              <span :class="item.done ? 'text-highlighted' : 'text-muted'">{{ item.label }}</span>
            </li>
          </ul>
        </UCard>
        <UCard variant="subtle">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">Información al cliente</p>
          <ul class="mt-2 space-y-1">
            <li v-for="item in clientItems" :key="item.key" class="flex items-center gap-2">
              <UIcon :name="item.done ? 'i-lucide-circle-check' : 'i-lucide-circle'" :class="item.done ? 'text-success' : 'text-muted'" class="size-4 shrink-0" />
              <span :class="item.done ? 'text-highlighted' : 'text-muted'">{{ item.label }}</span>
            </li>
            <li v-if="!clientItems.length" class="text-muted">Sin avisos pendientes.</li>
          </ul>
        </UCard>
        <UCard color="primary" variant="subtle">
          <p class="text-xs font-semibold uppercase tracking-wide text-primary">Por resolver</p>
          <ul class="mt-2 space-y-1">
            <li v-for="item in pendingItems" :key="item.key" class="flex items-center gap-2">
              <UIcon name="i-lucide-circle" class="size-4 shrink-0 text-warning" />
              <span class="font-semibold text-highlighted">{{ item.label }}</span>
            </li>
            <li v-if="!pendingItems.length" class="text-muted">Nada pendiente.</li>
          </ul>
        </UCard>
      </div>
      <p v-if="!progress.confirmation.completed && progress.confirmation.missing.length" class="mt-2 text-muted">
        Falta: {{ progress.confirmation.missing.join(', ') }}
      </p>

      <UCard
        v-if="pendingRefund"
        class="mt-3 text-sm"
        color="warning"
        variant="subtle"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p class="font-semibold">Reembolso</p>
            <p class="mt-0.5 text-muted">
              Lo aprueba Administración<span v-if="pendingRefund.blocks_close"> · frena el cierre</span>
            </p>
            <p class="mt-1 text-xs text-muted">{{ pendingRefund.origin_label }}</p>
            <a
              v-if="pendingRefund.voucher_url"
              :href="pendingRefund.voucher_url"
              target="_blank"
              rel="noopener"
              class="mt-2 inline-block font-semibold text-primary"
            >
              Ver comprobante
            </a>
          </div>
          <UBadge color="warning" variant="solid" size="sm">
            {{ pendingRefund.status_label }} ${{ money(pendingRefund.amount) }}
          </UBadge>
        </div>
      </UCard>

      <p v-if="progress.confirmation.can_decide_installment" class="mt-2" :class="progress.confirmation.decision_overdue ? 'font-semibold text-error' : 'text-muted'">
        {{ deadlineText }}
      </p>
      <div v-if="!readonly && progress.confirmation.can_decide_installment" class="mt-3 flex flex-wrap gap-2">
        <UButton size="sm" color="primary" :loading="saving" @click="choose(INSTALLMENT_CHOICE.PROCEED)">Se realizará</UButton>
        <UButton size="sm" color="neutral" variant="soft" :loading="saving" @click="choose(INSTALLMENT_CHOICE.CANCEL)">No se realizará</UButton>
      </div>
      <p v-else-if="progress.confirmation.second_installment_choice === INSTALLMENT_CHOICE.PROCEED" class="mt-2 text-muted">La cuota 2 se va a realizar.</p>
      <p v-else-if="progress.confirmation.second_installment_choice === INSTALLMENT_CHOICE.CANCEL" class="mt-2 text-muted">La cuota 2 no se realizará. No se cobra su comisión ni el segundo abono.</p>
      <div v-if="!readonly && progress.confirmation.can_decide_payment" class="mt-3 space-y-3">
        <p class="text-sm text-muted">
          Pago 2 de 2 · ¿Se va a realizar?
          <span v-if="deadlineText" :class="progress.confirmation.decision_overdue ? 'font-semibold text-error' : 'text-warning'"> · {{ deadlineText }}</span>
        </p>
        <div class="flex flex-wrap gap-2">
          <UButton size="sm" color="primary" :loading="saving" @click="choosePayment(PAYMENT_CHOICE.PROCEED)">Se realizará</UButton>
          <UButton size="sm" color="neutral" variant="soft" :loading="saving" @click="showCancelPayment = true">No se realizará</UButton>
        </div>
        <UCard v-if="showCancelPayment" color="error" variant="subtle">
          <p class="font-semibold">Pago 2 de 2: no se realizará</p>
          <p v-if="progress.confirmation.payment_two_refund" class="mt-2 text-sm">
            Carga del pago 2 ${{ money(progress.confirmation.payment_two_refund.cargo) }}
            · Comisión administrativa ${{ money(progress.confirmation.payment_two_refund.admin) }}
            · Total a devolver ${{ money(progress.confirmation.payment_two_refund.total) }}.
          </p>
          <p class="mt-1 text-xs text-muted">La comisión bancaria no se devuelve: el envío a China ya se hizo.</p>
          <UInput v-model="paymentReason" placeholder="Motivo" class="mt-2 w-full" />
          <div class="mt-2 flex flex-wrap gap-2">
            <UButton size="sm" color="neutral" variant="soft" :loading="saving" @click="choosePayment(PAYMENT_CHOICE.CANCEL)">Solo anular</UButton>
            <UButton size="sm" color="error" variant="soft" :loading="saving" @click="choosePayment(PAYMENT_CHOICE.REFUND)">Anular y solicitar reembolso</UButton>
          </div>
        </UCard>
      </div>
      <p v-else-if="progress.confirmation.second_payment_choice === PAYMENT_CHOICE.PROCEED" class="mt-2 text-muted">El pago 2 vuelve a ejecución.</p>
      <div v-if="!readonly && progress.confirmation.can_request_refund" class="mt-3">
        <UButton size="sm" color="primary" :loading="saving" @click="requestRefund">Solicitar reembolso</UButton>
      </div>
      <div v-if="!readonly && (progress.confirmation.can_send_balance || progress.confirmation.can_download_balance)" class="mt-3 flex flex-wrap gap-2">
        <UButton v-if="progress.confirmation.can_send_balance" size="sm" color="primary" variant="soft" :loading="saving" @click="openBalancePreview">Enviar balance al cliente</UButton>
        <UButton v-if="progress.confirmation.can_download_balance" size="sm" color="neutral" variant="soft" :loading="saving" @click="downloadBalance">Descargar balance PDF</UButton>
      </div>
      <UCard v-if="!readonly && progress.confirmation.can_register_exchange" class="mt-3" color="warning" variant="subtle">
      <form class="space-y-2" @submit.prevent="saveDifference">
        <p class="font-semibold">Diferencia por cobrar ${{ money(progress.confirmation.exchange_due_usd) }}. Administración la valida en Verificación.</p>
        <div class="flex flex-wrap items-end gap-2">
          <UFormField label="Importe"><UInput v-model.number="difference.importe" type="number" min="0" step="0.01" class="w-28" /></UFormField>
          <UFormField label="Fecha"><UInput v-model="difference.fecha" type="date" /></UFormField>
          <UFormField label="Banco">
            <USelect v-model="difference.banco" :items="[{ label: 'BCP', value: 'bcp' }, { label: 'Interbank', value: 'interbank' }]" class="w-36" />
          </UFormField>
          <UFormField label="N.° de operación"><UInput v-model="difference.operacion" class="w-36" /></UFormField>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" @change="onDifferenceFile" />
          <UButton type="submit" size="sm" color="primary" :loading="saving">Registrar voucher</UButton>
        </div>
      </form>
      </UCard>
      <div v-if="!readonly && progress.confirmation.can_complete" class="mt-3">
        <UButton size="sm" color="primary" :loading="saving" @click="markComplete">
          {{ progress.confirmation.complete_label || 'Marcar como Completado' }}
        </UButton>
      </div>
    </UCard>

    <SupplierPaymentWindow
      :open="!!balancePreview"
      title="Balance por WhatsApp"
      subtitle="Revisa el mensaje antes de enviarlo."
      @close="balancePreview = null"
    >
      <template v-if="balancePreview">
        <UCard variant="subtle">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <pre class="max-h-80 overflow-auto whitespace-pre-wrap font-sans text-sm text-highlighted" v-html="whatsappHtml(balancePreview.texto)" />
        </UCard>
        <p class="text-sm text-muted">Adjunto: {{ balancePreview.archivo }}</p>
      </template>
      <template #footer>
        <UButton color="neutral" variant="soft" @click="balancePreview = null">Cancelar</UButton>
        <UButton color="primary" :loading="saving" @click="sendBalance">Enviar balance</UButton>
      </template>
    </SupplierPaymentWindow>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { INSTALLMENT_CHOICE, PAYMENT_CHOICE } from '~/constants/supplierPayment'
import type { PagoProveedorSolicitudProveedor } from '~/types/pago-proveedor'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useSupplierPaymentProgress } from '~/composables/pago-proveedor/useSupplierPaymentProgress'

const props = withDefaults(defineProps<{
  solicitudId: number
  proveedor: PagoProveedorSolicitudProveedor
  readonly?: boolean
  viewing?: number | null
}>(), { readonly: false, viewing: null })
const emit = defineEmits<{ saved: []; 'complete-data': [] }>()
const { showError, showSuccess } = useModal()
const { withSpinner } = useSpinner()
const api = useSupplierPaymentProgress()
const saving = ref(false)
const showCancelPayment = ref(false)
const rate = ref<number | null>(null)
const paymentReason = ref('')
const differenceFile = ref<File | null>(null)
const difference = reactive({ importe: null as number | null, fecha: new Date().toLocaleDateString('en-CA'), banco: 'bcp', operacion: '' })
// The voucher form proposes the amount still owed (VW-16).
watch(() => props.proveedor.progreso?.confirmation?.exchange_due_usd, (due) => {
  if (due && !difference.importe) difference.importe = due
}, { immediate: true })
const progress = computed(() => props.proveedor.progreso)
const balancePreview = ref<{ texto: string; archivo: string } | null>(null)
const etapaVista = computed(() => props.viewing ?? props.proveedor.etapa)
const revisandoOtra = computed(() => etapaVista.value !== props.proveedor.etapa)
const muestraValidacion = computed(() => props.proveedor.etapa >= 2 && etapaVista.value === 2)
const muestraEjecucion = computed(() => props.proveedor.etapa >= 3 && etapaVista.value === 3)
const muestraConfirmacion = computed(() => !!progress.value?.confirmation.visible && etapaVista.value === 4)
const pendingRefund = computed(() => progress.value?.confirmation.pending_refund || null)
const hasPaidExecution = computed(() => (progress.value?.executions || []).some((item) => !!item.executed_on))
const needsProviderData = computed(() => {
  if (props.proveedor.etapa < 2) return false
  const deposits = progress.value?.verification.deposits || []
  const depositsOk = deposits.length > 0 && deposits.every((deposit) => deposit.status !== 'en_validacion' && deposit.status !== 'observado')
  if (!depositsOk) return false
  if (props.proveedor.moneda === 'RMB') {
    return !props.proveedor.datos?.wechat || !props.proveedor.datos?.vendedor_nombre
  }
  return props.proveedor.datos?.estado !== 'recibido'
})

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
    showError('Cuota 2', error?.data?.message || error?.message || 'No se pudo guardar la decisión.')
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
    showError('Pago 2', error?.data?.message || error?.message || 'No se pudo guardar la decisión.')
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

async function openBalancePreview() {
  saving.value = true
  try {
    const response = await withSpinner(() => api.previewBalance(props.solicitudId, props.proveedor.id), 'Preparando balance…')
    balancePreview.value = response.data
  } catch (error: any) {
    showError('Balance', error?.data?.message || error?.message || 'No se pudo preparar el balance.')
  } finally {
    saving.value = false
  }
}

async function sendBalance() {
  saving.value = true
  try {
    const response = await withSpinner(() => api.sendBalance(props.solicitudId, props.proveedor.id), 'Generando balance…')
    savePdf(response.pdf)
    balancePreview.value = null
    showSuccess('Balance', 'El mensaje y el PDF quedaron listos para el cliente.')
    emit('saved')
  } catch (error: any) {
    showError('Balance', error?.data?.message || error?.message || 'No se pudo enviar el balance.')
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
    showError('Balance', error?.data?.message || error?.message || 'No se pudo descargar el balance.')
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
    showError('Diferencia de cambio', error?.data?.message || error?.message || 'No se pudo registrar el voucher.')
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
    showError('Reembolso', error?.data?.message || error?.message || 'No se pudo solicitar el reembolso.')
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
    showError('Tipo de cambio', error?.data?.message || error?.message || 'No se pudo confirmar el tipo de cambio.')
  } finally {
    saving.value = false
  }
}

async function markComplete() {
  saving.value = true
  try {
    await withSpinner(() => api.complete(props.solicitudId, props.proveedor.id), 'Cerrando…')
    showSuccess('Confirmación', 'Proveedor marcado como Completado.')
    emit('saved')
  } catch (error: any) {
    showError('Confirmación', error?.data?.message || error?.message || 'No se pudo completar el proveedor.')
  } finally {
    saving.value = false
  }
}
</script>
