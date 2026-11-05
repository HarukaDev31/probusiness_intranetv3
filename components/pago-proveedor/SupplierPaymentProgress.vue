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
    <div v-if="muestraValidacion" class="grid gap-3 lg:grid-cols-3">
      <div class="bloque">
        <div class="bloque-cabeza"><span class="icono"><UIcon name="i-lucide-file-text" class="size-5" /></span><h3>Abonos del cliente</h3></div>
        <p class="text-xs text-muted">Importe cobrado · <strong class="text-highlighted">${{ money(proveedor.importe_requerido) }}</strong></p>
        <p v-if="!progress.verification.deposits.length" class="mt-2 text-sm text-muted">Sin abonos registrados.</p>
        <div v-for="deposit in progress.verification.deposits" :key="deposit.id" class="mt-2 text-sm">
          <strong>Abono #{{ deposit.id }} · ${{ money(deposit.amount) }}</strong>
          <p class="text-muted">{{ fechaCorta(deposit.paid_on) }}</p>
          <p class="text-muted">N.° de operación {{ deposit.operation_number || '—' }}</p>
        </div>
      </div>
      <div class="bloque">
        <div class="bloque-cabeza"><span class="icono"><UIcon name="i-lucide-shield-check" class="size-5" /></span><h3>Verificación del pago</h3></div>
        <span class="pastilla" :class="depositosPorValidar ? 'pastilla-pendiente' : depositosObservados ? 'pastilla-error' : 'pastilla-ok'">{{ depositosObservados ? 'Observado' : depositSummary }}</span>
        <p class="mt-2 text-sm text-muted">{{ depositosObservados ? 'Administración no pudo confirmar el ingreso del dinero.' : depositosPorValidar ? 'Administración comprueba que el dinero ingresó al banco.' : 'Los depósitos ya fueron revisados por Administración.' }}</p>
      </div>
      <div class="bloque">
        <div class="bloque-cabeza"><span class="icono"><UIcon name="i-lucide-circle-check" class="size-5" /></span><h3>Aprobación de pago</h3></div>
        <span class="pastilla pastilla-pendiente">{{ progress.verification.approval_label || 'Pendiente' }}</span>
        <p class="mt-2 text-sm text-muted">{{ needsProviderData ? 'Depósitos validados. Falta completar los datos del proveedor: sin ellos el pago no puede pasar a Ejecución de pago.' : depositosPorValidar ? 'Se evalúa cuando el depósito esté validado.' : 'Administración lo está evaluando.' }}</p>
        <UButton v-if="!readonly && needsProviderData" class="mt-2" size="sm" color="neutral" variant="outline" @click="emit('complete-data')">Completar datos</UButton>
      </div>
    </div>

    <div v-if="muestraEjecucion" class="grid gap-3 lg:grid-cols-3">
      <div class="bloque" :class="{ 'bloque-pendiente': needsProviderData }">
        <div class="bloque-cabeza"><span class="icono"><UIcon name="i-lucide-user" class="size-5" /></span><h3>Datos del proveedor</h3></div>
        <span class="pastilla" :class="needsProviderData ? 'pastilla-pendiente' : 'pastilla-ok'">{{ needsProviderData ? '! Pendientes' : '✓ Completos' }}</span>
        <dl v-if="proveedor.moneda === 'RMB' && !needsProviderData" class="mt-2 space-y-1 text-sm">
          <div class="flex justify-between gap-2"><dt class="text-muted">Nombre del vendedor</dt><dd class="font-semibold">{{ proveedor.datos?.vendedor_nombre || '—' }}</dd></div>
          <div class="flex justify-between gap-2"><dt class="text-muted">N.° de WeChat</dt><dd class="font-semibold">{{ proveedor.datos?.wechat || '—' }}</dd></div>
        </dl>
        <p v-else-if="!needsProviderData" class="mt-2 text-sm text-muted">{{ proveedor.datos?.beneficiario_nombre }} · {{ proveedor.datos?.banco_nombre }}</p>
        <p v-else class="mt-2 text-sm text-muted">{{ responsablePago }} los necesita para ejecutar el pago.</p>
        <UButton v-if="!readonly && needsProviderData" class="mt-2" size="sm" color="neutral" variant="outline" @click="emit('complete-data')">Completar datos</UButton>
        <a v-if="proveedor.proforma_url" :href="proveedor.proforma_url" target="_blank" rel="noopener" class="mt-2 block text-sm font-semibold text-orange-600 underline">Ver proforma</a>
      </div>
      <div class="bloque">
        <div class="bloque-cabeza"><span class="icono"><UIcon name="i-lucide-circle-dollar-sign" class="size-5" /></span><h3>{{ hasPaidExecution ? 'Importe pagado' : 'Importe a pagar' }}</h3></div>
        <p class="text-3xl font-bold">{{ importeEnMoneda(importePago) }}</p>
        <span class="pastilla pastilla-info mt-2">{{ proveedor.moneda }}</span>
        <p class="mt-2 text-sm text-muted">{{ proveedor.moneda === 'RMB' ? 'Valor de la carga en yuanes.' : 'Valor de la carga que se transfiere al proveedor.' }}</p>
      </div>
      <div class="bloque">
        <div class="bloque-cabeza"><span class="icono"><UIcon name="i-lucide-receipt-text" class="size-5" /></span><h3>Registro de pago</h3></div>
        <span class="pastilla" :class="hasPaidExecution ? 'pastilla-ok' : 'pastilla-pendiente'">{{ hasPaidExecution ? '✓ Registrado' : 'Pendiente' }}</span>
        <p v-if="!progress.executions.length" class="mt-2 text-sm text-muted">Lo registra {{ responsablePago }}. Te avisamos cuando suban la constancia.</p>
        <div v-for="execution in progress.executions" :key="execution.id" class="mt-2 text-sm">
          <p class="text-muted">{{ fechaCorta(execution.executed_on) }}</p>
          <a v-if="execution.receipt_url" :href="execution.receipt_url" target="_blank" rel="noopener" class="font-semibold text-orange-600 underline">Ver constancia</a>
          <p v-else class="text-muted">Constancia pendiente</p>
        </div>
      </div>
    </div>

    <template v-if="muestraConfirmacion">
      <div class="grid items-start gap-3 lg:grid-cols-3">
        <div class="bloque">
          <div class="bloque-cabeza"><span class="icono"><UIcon name="i-lucide-chart-no-axes-column" class="size-5" /></span><h3>Resumen de la operación</h3></div>
          <dl class="divide-y divide-default text-sm">
            <div class="flex items-start justify-between gap-2 py-2">
              <dt>Monto total del proveedor<small class="block text-xs text-muted">Carga ${{ money(proveedor.valor_carga_usd) }} + comisiones ${{ money(proveedor.total_monto - proveedor.valor_carga_usd) }}</small></dt>
              <dd class="whitespace-nowrap"><span class="text-xs text-muted">USD</span> <strong class="text-base">${{ money(proveedor.total_monto) }}</strong></dd>
            </div>
            <div class="flex items-center justify-between gap-2 py-2"><dt>Abono del cliente</dt><dd class="whitespace-nowrap"><span class="text-xs text-muted">USD</span> <strong class="text-base">${{ money(proveedor.importe_abonado) }}</strong></dd></div>
            <div v-for="execution in progress.executions" :key="`paid-${execution.id}`" class="flex items-start justify-between gap-2 py-2">
              <dt>Pago al proveedor</dt>
              <dd class="whitespace-nowrap text-right"><span class="text-xs text-muted">USD</span> <strong class="text-base">${{ money(execution.cargo_amount) }}</strong><small v-if="proveedor.moneda === 'RMB' && tipoCambio" class="block text-xs text-muted">¥{{ money(execution.cargo_amount * tipoCambio) }}</small></dd>
            </div>
          </dl>
          <p class="mt-3 flex items-center gap-2 text-sm font-bold"><UIcon name="i-lucide-file-text" class="size-4 text-orange-600" />Documentos</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <UButton v-if="proveedor.proforma_url" size="sm" color="info" variant="soft" icon="i-lucide-eye" :to="proveedor.proforma_url" target="_blank">Ver proforma</UButton>
            <p v-else class="text-sm text-muted">Sin documentos.</p>
          </div>
        </div>

        <div class="bloque bloque-pendiente">
          <div class="bloque-cabeza"><span class="icono"><UIcon name="i-lucide-send" class="size-5" /></span><h3>Información al cliente</h3></div>
          <div v-for="execution in progress.executions" :key="`receipt-${execution.id}`" class="fila-bloque">
            <div><strong>Constancia de pago</strong><p class="text-xs text-muted">{{ fechaCorta(execution.executed_on) }}</p></div>
            <a v-if="execution.receipt_url" :href="execution.receipt_url" target="_blank" rel="noopener" class="pastilla pastilla-ok">✓ Registrada</a>
            <span v-else class="pastilla pastilla-pendiente">Falta registrarla</span>
          </div>
          <div v-for="item in clientItems" :key="item.key" class="fila-bloque">
            <strong>{{ item.label }}</strong>
            <span class="pastilla" :class="item.done ? 'pastilla-ok' : 'pastilla-pendiente'">{{ item.done ? '✓ Listo' : 'Pendiente' }}</span>
          </div>
          <div v-if="!readonly && (progress.confirmation.can_send_balance || progress.confirmation.can_download_balance)" class="fila-bloque">
            <strong>Balance de cambio</strong>
            <div class="flex flex-wrap justify-end gap-1.5">
              <UButton v-if="progress.confirmation.can_download_balance" size="xs" color="neutral" variant="outline" icon="i-lucide-download" title="Descargar balance" :loading="saving" @click="downloadBalance" />
              <UButton v-if="progress.confirmation.can_send_balance" size="xs" class="boton-naranja" icon="i-mdi-whatsapp" :loading="saving" @click="openBalancePreview">Enviar por WhatsApp</UButton>
            </div>
          </div>
          <p v-if="!clientItems.length && !progress.executions.length" class="text-sm text-muted">Sin avisos pendientes.</p>
        </div>

        <div class="bloque" :class="{ 'bloque-pendiente': pendingItems.length }">
          <div class="bloque-cabeza"><span class="icono"><UIcon name="i-lucide-circle-check" class="size-5" /></span><h3>Por resolver</h3></div>
          <span class="pastilla mb-2" :class="pendingItems.length ? 'pastilla-pendiente' : 'pastilla-ok'">{{ pendingItems.length ? `${pendingItems.length} pendiente${pendingItems.length > 1 ? 's' : ''}` : '✓ Nada pendiente' }}</span>
          <div v-for="item in pendingItems" :key="item.key" class="fila-bloque"><strong>{{ item.label }}</strong></div>

          <div v-if="pendingRefund" class="fila-bloque">
            <div>
              <strong>Reembolso</strong>
              <p class="text-xs text-muted">Lo aprueba Administración<span v-if="pendingRefund.blocks_close"> · frena el cierre</span></p>
              <p class="text-xs text-muted">{{ pendingRefund.origin_label }}</p>
              <a v-if="pendingRefund.voucher_url" :href="pendingRefund.voucher_url" target="_blank" rel="noopener" class="text-xs font-semibold text-orange-600 underline">Ver comprobante</a>
            </div>
            <span class="pastilla pastilla-info">{{ pendingRefund.status_label }} ${{ money(pendingRefund.amount) }}</span>
          </div>

          <div v-if="progress.confirmation.can_decide_installment || progress.confirmation.second_installment_choice" class="fila-bloque block">
            <strong>Cuota 2</strong>
            <template v-if="!readonly && progress.confirmation.can_decide_installment">
              <p class="text-xs" :class="progress.confirmation.decision_overdue ? 'font-semibold text-error' : 'text-muted'">¿Se va a realizar? · {{ deadlineText }}</p>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <UButton size="sm" color="neutral" variant="outline" class="justify-center" :loading="saving" @click="choose(INSTALLMENT_CHOICE.PROCEED)">Se realizará</UButton>
                <UButton size="sm" color="neutral" variant="outline" class="justify-center" :loading="saving" @click="choose(INSTALLMENT_CHOICE.CANCEL)">No se realizará</UButton>
              </div>
              <p class="mt-2 text-xs text-muted">Si se realiza, se registra el abono de la cuota 2. Si no, el proveedor se cierra sin cobrarla.</p>
            </template>
            <p v-else-if="progress.confirmation.second_installment_choice === INSTALLMENT_CHOICE.PROCEED" class="text-xs text-muted">La cuota 2 se va a realizar.</p>
            <p v-else-if="progress.confirmation.second_installment_choice === INSTALLMENT_CHOICE.CANCEL" class="text-xs text-muted">La cuota 2 no se realizará. No se cobra su comisión ni el segundo abono.</p>
          </div>

          <div v-if="!readonly && progress.confirmation.can_decide_payment" class="fila-bloque block">
            <strong>Pago 2 de 2</strong>
            <p class="text-xs" :class="progress.confirmation.decision_overdue ? 'font-semibold text-error' : 'text-muted'">¿Se va a realizar?<template v-if="deadlineText"> · {{ deadlineText }}</template></p>
            <div class="mt-2 grid grid-cols-2 gap-2">
              <UButton size="sm" color="neutral" variant="outline" class="justify-center" :loading="saving" @click="choosePayment(PAYMENT_CHOICE.PROCEED)">Se realizará</UButton>
              <UButton size="sm" color="neutral" variant="outline" class="justify-center" :loading="saving" @click="showCancelPayment = true">No se realizará</UButton>
            </div>
            <p v-if="progress.confirmation.payment_two_refund" class="mt-2 text-xs text-muted">Si no se realiza, se devuelve la carga de ese pago y su administrativa (${{ money(progress.confirmation.payment_two_refund.total) }}). La comisión bancaria no se devuelve: el envío a China ya se hizo.</p>
            <template v-if="showCancelPayment">
              <UInput v-model="paymentReason" placeholder="Motivo" class="mt-2 w-full" />
              <div class="mt-2 flex flex-wrap gap-2">
                <UButton size="sm" color="neutral" variant="soft" :loading="saving" @click="choosePayment(PAYMENT_CHOICE.CANCEL)">Solo anular</UButton>
                <UButton size="sm" color="error" variant="soft" :loading="saving" @click="choosePayment(PAYMENT_CHOICE.REFUND)">Anular y solicitar reembolso</UButton>
              </div>
            </template>
          </div>
          <p v-else-if="progress.confirmation.second_payment_choice === PAYMENT_CHOICE.PROCEED" class="mt-2 text-xs text-muted">El pago 2 vuelve a ejecución.</p>

          <UButton v-if="!readonly && progress.confirmation.can_request_refund" class="mt-2 boton-naranja" size="sm" :loading="saving" @click="requestRefund">Solicitar reembolso</UButton>

          <form v-if="!readonly && progress.confirmation.can_register_exchange" class="fila-bloque block space-y-2" @submit.prevent="saveDifference">
            <strong>Diferencia de cambio</strong>
            <p class="text-xs text-muted">Por cobrar ${{ money(progress.confirmation.exchange_due_usd) }}. Administración la valida en Verificación.</p>
            <UFormField label="Importe"><UInput v-model.number="difference.importe" type="number" min="0" step="0.01" class="w-full" /></UFormField>
            <UFormField label="Fecha"><UInput v-model="difference.fecha" type="date" class="w-full" /></UFormField>
            <UFormField label="Banco"><USelect v-model="difference.banco" :items="[{ label: 'BCP', value: 'bcp' }, { label: 'Interbank', value: 'interbank' }]" class="w-full" /></UFormField>
            <UFormField label="N.° de operación"><UInput v-model="difference.operacion" class="w-full" /></UFormField>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" class="block w-full text-sm" @change="onDifferenceFile" />
            <UButton type="submit" size="sm" class="boton-naranja" :loading="saving">Registrar voucher de la diferencia</UButton>
          </form>
        </div>
      </div>

      <div class="bloque">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-56 flex-1">
            <div class="h-2 max-w-sm overflow-hidden rounded-full bg-elevated"><div class="h-full bg-green-700" :style="{ width: `${avanceConfirmacion}%` }" /></div>
            <p class="mt-1.5 text-sm font-semibold">
              <template v-if="progress.confirmation.completed">Completado</template>
              <template v-else>{{ progress.confirmation.done_count }} de {{ progress.confirmation.total }}<template v-if="progress.confirmation.missing.length"> · Falta: {{ progress.confirmation.missing.join(', ') }}</template></template>
            </p>
          </div>
          <p class="text-xs text-muted">Esta etapa se completa cuando no queda nada pendiente.</p>
          <UButton v-if="!readonly && progress.confirmation.can_complete" size="sm" class="boton-naranja" :loading="saving" @click="markComplete">{{ progress.confirmation.complete_label || 'Marcar como Completado' }}</UButton>
        </div>
      </div>
    </template>

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
  tipoCambio?: number | null
}>(), { readonly: false, viewing: null, tipoCambio: null })
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

const depositosPorValidar = computed(() => (progress.value?.verification.deposits || []).some((deposit) => deposit.status === 'en_validacion'))
const depositosObservados = computed(() => (progress.value?.verification.deposits || []).some((deposit) => deposit.status === 'observado'))
const responsablePago = computed(() => props.proveedor.moneda === 'RMB' ? 'Operaciones China' : 'Administración')
const importePago = computed(() => {
  const executions = progress.value?.executions || []
  return executions.length ? executions.reduce((suma, execution) => suma + Number(execution.cargo_amount || 0), 0) : Number(props.proveedor.valor_carga_usd || 0)
})
const avanceConfirmacion = computed(() => {
  const confirmation = progress.value?.confirmation
  if (!confirmation) return 0
  if (confirmation.completed) return 100
  return confirmation.total ? Math.round(confirmation.done_count * 100 / confirmation.total) : 0
})
const clientItems = computed(() => (progress.value?.confirmation.items || []).filter((item) => ['client_notice', 'exchange'].includes(item.key)))
const pendingItems = computed(() => (progress.value?.confirmation.items || []).filter((item) => !item.done && item.blocks))

const deadlineText = computed(() => {
  const confirmation = progress.value?.confirmation
  if (!confirmation) return ''
  if (confirmation.decision_due_text) return confirmation.decision_due_text
  if (!confirmation.decision_due_at) return 'Plazo de 72 h para decidir.'
  return confirmation.decision_overdue ? 'El plazo ya venció. Igual puedes elegir.' : 'Tienes plazo para decidir.'
})

function fechaCorta(fecha?: string | null) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha || '')
  return partes ? `${Number(partes[3])}/${Number(partes[2])}/${partes[1]}` : (fecha || 'Sin fecha')
}

function importeEnMoneda(usd: number) {
  if (props.proveedor.moneda === 'RMB' && Number(props.tipoCambio) > 0) return `¥${money(usd * Number(props.tipoCambio))}`
  return `${money(usd)}`
}

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

<style scoped>
.bloque {
  border: 1px solid var(--ui-border);
  border-radius: 0.875rem;
  padding: 1rem;
}
.bloque-pendiente {
  border-color: rgb(245 158 11 / 0.45);
  background: rgb(245 158 11 / 0.07);
}
.bloque-cabeza {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  font-weight: 700;
}
.fila-bloque {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.5rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.625rem;
  background: var(--ui-bg);
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
}
.fila-bloque.block {
  display: block;
}
.icono {
  display: flex;
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: rgb(249 115 22 / 0.12);
  color: #ea580c;
}
.pastilla {
  display: inline-block;
  flex-shrink: 0;
  border-radius: 9999px;
  padding: 0.1rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 700;
}
.pastilla-pendiente {
  background: rgb(245 158 11 / 0.18);
  color: #b45309;
}
.pastilla-ok {
  background: rgb(34 197 94 / 0.15);
  color: #15803d;
}
.pastilla-error {
  background: rgb(239 68 68 / 0.14);
  color: #b91c1c;
}
.pastilla-info {
  background: rgb(59 130 246 / 0.14);
  color: #1d4ed8;
}
.boton-naranja {
  background: #f97316 !important;
  color: #fff !important;
}
</style>
