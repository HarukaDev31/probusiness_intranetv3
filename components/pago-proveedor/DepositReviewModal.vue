<template>
  <SupplierPaymentWindow
    :open="deposit !== null"
    :title="windowTitle"
    :subtitle="subtitle"
    :code="requestCodes"
    code-right
    :hint="hintText"
    wide
    @close="emit('close')"
  >
    <template #pill>
      <UBadge
        :color="slaPill.color"
        variant="soft"
        :label="slaPill.label"
        :title="slaPill.title"
      />
    </template>

    <div v-if="deposit" class="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
      <div class="flex flex-col gap-3">
        <SupplierPaymentCard title="Comprobante">
          <VoucherViewer :url="deposit.voucher_url" :name="deposit.voucher_name" />
        </SupplierPaymentCard>

        <UAlert
          v-if="deposit.interbank"
          color="warning"
          variant="subtle"
          icon="i-heroicons-exclamation-triangle"
          title="Interbancaria o cajero"
          description="Revisa si el banco aplicó comisiones o cargos: el voucher puede no mostrar lo que realmente ingresó."
        />
      </div>

      <div class="flex flex-col gap-3.5">
        <!-- h-auto/shrink-0: cada tarjeta mide lo que su contenido (antes se recortaban y el botón Editar quedaba oculto). -->
        <SupplierPaymentCard title="Datos registrados por Ventas" class="h-auto shrink-0">
          <SupplierPaymentFact label="Cliente" :value="deposit.client_name || '—'" />
          <SupplierPaymentFact label="N.° de consolidado" :value="deposit.consolidation || '—'" />
          <SupplierPaymentFact label="Código de solicitud">
            <span v-if="providerCodes.length" class="flex flex-col items-end gap-0.5">
              <a
                v-for="code in providerCodes"
                :key="code"
                :href="`/pago-proveedor/aprobacion-pagos?codigo=${encodeURIComponent(code)}`"
                class="font-mono text-xs font-semibold text-primary hover:underline"
                :title="`Ir a Aprobación de pagos · ${code}`"
              >{{ code }}</a>
            </span>
            <span v-else class="italic text-muted" title="Se genera cuando el abono del proveedor está completo y avanza a Validación">Pendiente</span>
          </SupplierPaymentFact>
          <!-- Como la maqueta: al editar, banco, fecha y N.° de operación pasan a campos en la misma fila. -->
          <template v-if="editing">
            <SupplierPaymentFact label="Banco">
              <USelect v-model="form.bank" :items="bancos" size="sm" class="w-40" />
            </SupplierPaymentFact>
            <SupplierPaymentFact label="Fecha del depósito">
              <UInput v-model="form.paid_on" type="date" size="sm" class="w-40" />
            </SupplierPaymentFact>
            <SupplierPaymentFact label="N.° de operación">
              <UInput v-model="form.operation_number" size="sm" class="w-40" :ui="{ base: 'text-right' }" />
            </SupplierPaymentFact>
          </template>
          <template v-else>
            <SupplierPaymentFact label="Banco">
              {{ bankLabel }}
              <UBadge v-if="deposit.interbank" size="sm" color="neutral" variant="subtle" label="Interbancaria / cajero" />
            </SupplierPaymentFact>
            <SupplierPaymentFact label="Fecha del depósito" :value="fechaDmy(deposit.paid_on)" />
            <SupplierPaymentFact label="N.° de operación" :value="deposit.operation_number || '—'" />
          </template>
          <SupplierPaymentFact v-if="deposit.purpose === 'exchange_difference'" label="Tipo de abono" :value="deposit.purpose_label || 'Diferencia de cambio'" />

          <div v-if="deposit.can_validate && !editing" class="mt-3 flex items-center gap-4 rounded-lg bg-slate-100 px-4 py-3 dark:bg-slate-800">
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              icon="i-heroicons-pencil"
              class="shrink-0 bg-white font-semibold ring-slate-400 dark:bg-slate-900"
              title="Corregir banco, fecha o número de operación"
              @click="startEdit"
            >
              Editar
            </UButton>
            <p class="border-l border-slate-300 pl-4 text-xs leading-snug text-muted dark:border-slate-600">Si Ventas se equivocó al digitar el banco, la fecha o el N.° de operación, edítalo: queda registrado y se avisa a Ventas.</p>
          </div>
          <div v-else-if="deposit.can_validate" class="mt-2 flex flex-col gap-2">
            <p class="text-xs text-muted">Editando: corrige lo que Ventas digitó mal y guarda los cambios.</p>
            <div class="flex flex-wrap items-center gap-2">
              <UButton size="sm" class="boton-naranja" :loading="saving" @click="saveDetails">Guardar cambios</UButton>
              <UButton size="sm" color="neutral" variant="outline" @click="editing = false">Cancelar</UButton>
              <span class="text-xs text-muted">Guardar no valida el depósito.</span>
            </div>
          </div>

          <p v-if="deposit.corrected_by_admin" class="mt-2 text-xs text-muted">
            Corregido por Administración: queda registrado y se avisa a Ventas.
          </p>
          <p v-if="deposit.shared" class="mt-3 flex items-center gap-2 text-xs text-muted">
            <UIcon name="i-heroicons-information-circle" class="size-4 shrink-0 text-highlighted" />
            Voucher compartido con {{ deposit.providers.length }} proveedores. Se verifica una sola vez.
          </p>
        </SupplierPaymentCard>

        <UAlert
          v-if="deposit.observation_detail || deposit.observation_reason"
          color="error"
          variant="subtle"
          icon="i-heroicons-exclamation-circle"
          :title="`Observado${reasonLabel ? `: ${reasonLabel}` : ''}`"
          :description="deposit.observation_detail || (slaText(deposit.sla) || undefined)"
        />

        <SupplierPaymentCard title="Importes (USD)" class="h-auto shrink-0">
          <div class="grid gap-2 sm:grid-cols-2">
            <UCard variant="subtle" :ui="{ body: 'px-3 py-2 sm:px-3 sm:py-2' }">
              <p class="text-[11px] font-bold uppercase tracking-wide text-muted">Importe registrado (Ventas)</p>
              <p class="mt-1 text-lg font-bold text-highlighted">${{ money(deposit.recorded_amount ?? deposit.amount) }}</p>
            </UCard>
            <UCard color="primary" variant="subtle" :ui="{ body: 'px-3 py-2 sm:px-3 sm:py-2' }">
              <p class="text-[11px] font-bold uppercase tracking-wide text-primary">Importe ingresado (Banco)</p>
              <div class="mt-1 flex items-center gap-0.5 text-lg font-bold text-primary">
                <span>$</span>
                <UInput
                  v-model.number="bankAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  variant="none"
                  :disabled="!deposit.can_validate"
                  class="w-full text-lg font-bold"
                  aria-label="Importe ingresado (Banco) en USD"
                />
              </div>
            </UCard>
          </div>
          <p class="mt-1.5 text-xs text-muted">Compáralo con el importe que muestra el comprobante.</p>
          <div class="mt-2 rounded-md px-3 py-2 text-xs" :class="differenceBox.class">
            {{ differenceBox.text }}
          </div>
          <p v-if="deposit.recorded_amount != null" class="mt-1.5 text-xs text-warning">
            Ventas registró ${{ money(deposit.recorded_amount) }} · se ajustó al importe del banco.
          </p>
        </SupplierPaymentCard>
      </div>
    </div>

    <UCard v-if="observing" class="space-y-3" color="error" variant="subtle">
      <h4 class="text-sm font-bold text-error">Observar depósito</h4>
      <UFormField label="Motivo">
        <USelect v-model="reason" :items="motivos" class="w-full" />
      </UFormField>
      <UFormField v-if="reason === 'other'" label="Nuevo motivo">
        <UInput v-model="newLabel" placeholder="Se guarda para la próxima vez" class="w-full" />
      </UFormField>
      <UFormField label="Detalle">
        <UTextarea v-model="detail" :rows="2" class="w-full" />
      </UFormField>
    </UCard>
    <UCard v-if="extending" class="space-y-3" color="warning" variant="subtle">
      <h4 class="text-sm font-bold text-warning">Extender el plazo de la observación</h4>
      <UFormField label="Días adicionales">
        <UInput v-model.number="extendDays" type="number" min="1" max="60" class="w-full" />
      </UFormField>
      <UFormField label="Motivo">
        <UTextarea v-model="extendReason" :rows="2" class="w-full" />
      </UFormField>
    </UCard>
    <UCard v-if="cancelling" class="space-y-3" color="error" variant="subtle">
      <h4 class="text-sm font-bold text-error">Anular el pago</h4>
      <p class="text-sm text-muted">El pago deja de continuar. Indica el motivo.</p>
      <UFormField label="Motivo">
        <UTextarea v-model="cancelReason" :rows="2" class="w-full" />
      </UFormField>
    </UCard>

    <template #footer>
      <UButton v-if="deposit?.can_validate" color="neutral" variant="ghost" @click="emit('close')">Cancelar</UButton>
      <UButton v-else color="neutral" variant="ghost" @click="emit('close')">Cerrar</UButton>
      <UButton v-if="deposit?.can_extend && !extending && !cancelling" color="neutral" variant="soft" @click="extending = true">Extender plazo</UButton>
      <UButton v-if="extending" color="primary" :loading="saving" @click="extendObservation">Confirmar extensión</UButton>
      <UButton v-if="deposit?.can_cancel_payment && !cancelling && !extending" color="error" variant="soft" @click="cancelling = true">Anular pago</UButton>
      <UButton v-if="cancelling" color="error" :loading="saving" @click="cancelPayment">Confirmar anulación</UButton>
      <UButton v-if="deposit?.can_undo && !extending && !cancelling" color="neutral" variant="soft" :loading="saving" @click="undo">
        Deshacer{{ deposit.undo_notifies_sales ? ' y avisar a Ventas' : '' }}
      </UButton>
      <UButton v-if="deposit?.can_validate && !observing" color="error" variant="soft" icon="i-heroicons-exclamation-circle" @click="observing = true">Observar</UButton>
      <UButton v-if="deposit?.can_validate && observing" color="error" :loading="saving" @click="observe">Confirmar observación</UButton>
      <UButton v-if="deposit?.can_validate && !observing" color="primary" :loading="saving" @click="validate">Validar depósito</UButton>
    </template>
  </SupplierPaymentWindow>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SupplierPaymentCard from '~/components/pago-proveedor/SupplierPaymentCard.vue'
import SupplierPaymentFact from '~/components/pago-proveedor/SupplierPaymentFact.vue'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'
import VoucherViewer from '~/components/pago-proveedor/VoucherViewer.vue'
import { DEPOSIT_BANK, DEPOSIT_STATUS } from '~/constants/supplierPayment'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import type { SupplierPaymentDeposit, SupplierPaymentObservationReason, SupplierPaymentSla } from '~/types/pago-proveedor'
import { useModal } from '~/composables/commons/useModal'
import { slaOverdue, slaText, useSlaCountdown } from '~/composables/pago-proveedor/useSlaCountdown'

const props = defineProps<{
  deposit: SupplierPaymentDeposit | null
  reasons: SupplierPaymentObservationReason[]
}>()

const emit = defineEmits<{ close: []; saved: [] }>()
const { showError, showSuccess } = useModal()
useSlaCountdown()

const editing = ref(false)
const observing = ref(false)
const extending = ref(false)
const cancelling = ref(false)
const saving = ref(false)
const bankAmount = ref(0)
const reason = ref('')
const newLabel = ref('')
const detail = ref('')
const extendReason = ref('')
const extendDays = ref(7)
const cancelReason = ref('')
const form = ref({ bank: DEPOSIT_BANK.BCP as string, paid_on: '', operation_number: '' })
const bancos = [
  { label: 'BCP', value: DEPOSIT_BANK.BCP },
  { label: 'Interbank', value: DEPOSIT_BANK.INTERBANK }
]
const motivos = computed(() => [
  ...props.reasons.map((item) => ({ label: item.label, value: item.code })),
  { label: 'Otro motivo', value: 'other' }
])

watch(() => props.deposit, (deposit) => {
  editing.value = false
  observing.value = false
  extending.value = false
  cancelling.value = false
  newLabel.value = ''
  detail.value = ''
  extendReason.value = ''
  extendDays.value = 7
  cancelReason.value = ''
  reason.value = props.reasons[0]?.code || ''
  if (!deposit) return
  bankAmount.value = deposit.bank_amount ?? deposit.amount
  form.value = {
    bank: deposit.bank,
    paid_on: deposit.paid_on || '',
    operation_number: deposit.operation_number
  }
}, { immediate: true })

/** Fecha del depósito como DD-MM-AAAA (la API la manda AAAA-MM-DD). */
function fechaDmy(value?: string | null) {
  if (!value) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  return m ? `${m[3]}-${m[2]}-${m[1]}` : value
}

const requestCodes = computed(() => {
  const codes = (props.deposit?.providers || []).map((provider) => provider.request_code).filter(Boolean)
  return codes.length ? codes.join(', ') : 'Pendiente'
})
/** Códigos individuales (la maqueta los lista uno por línea con enlace a Aprobación de pagos). */
const providerCodes = computed(() => (props.deposit?.providers || [])
  .map((provider) => provider.request_code)
  .filter((code): code is string => !!code))
const bankLabel = computed(() => props.deposit?.bank_label || '—')

/** Título según el modo, como la maqueta: Validar depósito / Depósito observado / Depósito validado. */
const windowTitle = computed(() => {
  const deposit = props.deposit
  if (!deposit) return 'Validar depósito'
  if (deposit.can_validate) return 'Validar depósito'
  if (deposit.status === DEPOSIT_STATUS.OBSERVED) return 'Depósito observado'
  if (deposit.status === DEPOSIT_STATUS.VALIDATED) return 'Depósito validado'
  return deposit.status_label || 'Depósito'
})
const reasonLabel = computed(() => props.reasons.find((item) => item.code === props.deposit?.observation_reason)?.label || props.deposit?.observation_reason)
const subtitle = computed(() => {
  if (!props.deposit) return ''
  return `${props.deposit.client_name || 'Cliente'} · Consolidado ${props.deposit.consolidation || 'sin identificar'}`
})

/** Pista del pie: solo al validar (igual que la maqueta); en estados cerrados el pie queda limpio. */
const hintText = computed(() => (props.deposit?.can_validate
  ? 'Si el banco recibió otro importe, escríbelo: manda el banco y se ajusta el registro de Ventas.'
  : ''))

/** Píldora del encabezado: plazo real del backend o estado de la verificación. */
const slaPill = computed(() => {
  const deposit = props.deposit
  if (!deposit) return { color: 'warning' as const, label: 'Por validar', title: '' }
  if (deposit.can_validate) {
    const expired = slaOverdue(deposit.sla)
    const text = slaText(deposit.sla) || `${deposit.sla?.hours ?? 0} h`
    return {
      color: expired ? 'error' as const : 'warning' as const,
      label: `${expired ? '⏰ ' : ''}Plazo para validar: ${text}`,
      title: slaSource(deposit.sla)
    }
  }
  if (deposit.status === DEPOSIT_STATUS.OBSERVED) return { color: 'error' as const, label: 'Observado', title: slaSource(deposit.sla) }
  if (deposit.status === DEPOSIT_STATUS.VALIDATED) return { color: 'success' as const, label: 'Validado', title: slaSource(deposit.sla) }
  return { color: 'neutral' as const, label: deposit.status_label, title: '' }
})

/** De dónde sale el plazo: registrado y vencimiento calculados en el backend. */
function slaSource(sla?: SupplierPaymentSla | null) {
  if (!sla?.deadline_at) return 'El plazo lo calcula el servidor.'
  const format = (value: string) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
  }
  const registered = sla.registered_at ? `Registrado el ${format(sla.registered_at)}` : 'Registro'
  return `${registered} · vence el ${format(sla.deadline_at)} (plazo de ${sla.hours} h definido por Administración)`
}

/** Comparación en vivo: la tolerancia y el límite excepcional vienen del backend. */
const differenceBox = computed(() => {
  const deposit = props.deposit
  const value = Number(bankAmount.value)
  if (!deposit) return { class: 'bg-elevated text-muted', text: '' }
  if (!Number.isFinite(value) || value <= 0) {
    return { class: 'bg-elevated text-error', text: 'Si el dinero no ingresó al banco, usa Observar.' }
  }
  const recorded = Number(deposit.recorded_amount ?? deposit.amount)
  const difference = Number((value - recorded).toFixed(2))
  const tolerance = Number(deposit.comparison?.tolerance ?? 0)
  const exceptionLimit = Number(deposit.comparison?.exception_limit ?? 0)
  const money = (amount: number) => `$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (Math.abs(difference) < 0.005) {
    return { class: 'bg-success/10 text-success', text: '✓ Coincide con el importe registrado.' }
  }
  const amount = money(difference)
  const withinTolerance = Math.abs(difference) <= tolerance
  const withinException = Math.abs(difference) <= exceptionLimit
  if (difference < 0) {
    if (withinTolerance) {
      return {
        class: 'bg-success/10 text-success',
        text: `Faltan ${amount} frente al importe registrado, dentro de la tolerancia de ${money(tolerance)}: lo asume Probusiness al aprobar el pago.`
      }
    }
    if (withinException) {
      return {
        class: 'bg-warning/10 text-warning',
        text: `Faltan ${amount}: supera la tolerancia de ${money(tolerance)}, pero está dentro del límite excepcional de ${money(exceptionLimit)}. Al aprobar el pago podrás aceptarlo con motivo.`
      }
    }
    return {
      class: 'bg-error/10 text-error',
      text: `⚠ Faltan ${amount}: supera la tolerancia de ${money(tolerance)}. Puedes validarlo y decidir al aprobar el pago, u observar para que Ventas cobre la diferencia al cliente.`
    }
  }
  if (withinTolerance) {
    return {
      class: 'bg-success/10 text-success',
      text: `Sobran ${amount} frente al importe registrado, dentro de la tolerancia de ${money(tolerance)}.`
    }
  }
  return {
    class: 'bg-warning/10 text-warning',
    text: `Sobran ${amount}: supera la tolerancia de ${money(tolerance)}. Ventas consultará al cliente si prefiere reembolso o aplicarlo a la siguiente cuota.`
  }
})

function money(value: number) {
  return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function startEdit() {
  if (!props.deposit) return
  form.value = {
    bank: props.deposit.bank,
    paid_on: props.deposit.paid_on || '',
    operation_number: props.deposit.operation_number
  }
  editing.value = true
}

async function run(action: () => Promise<void>, success: string) {
  saving.value = true
  try {
    await action()
    showSuccess('Depósito', success)
    emit('saved')
    emit('close')
  } catch (error: any) {
    showError('Depósito', error?.data?.message || error?.message || 'No se pudo completar.')
  } finally {
    saving.value = false
  }
}

function saveDetails() {
  if (!props.deposit) return
  return run(
    () => PagoProveedorService.updateDeposit(props.deposit!.id, form.value).then(() => undefined),
    'Los datos quedaron corregidos. El depósito sigue sin validar.'
  )
}

function validate() {
  if (!props.deposit) return
  return run(
    () => PagoProveedorService.validateDeposit(props.deposit!.id, Number(bankAmount.value)).then(() => undefined),
    'Depósito validado.'
  )
}

function observe() {
  if (!props.deposit) return
  return run(
    () => PagoProveedorService.observeDeposit(props.deposit!.id, {
      reason: reason.value || undefined,
      detail: detail.value || undefined,
      new_label: reason.value === 'other' ? newLabel.value : undefined
    }).then(() => undefined),
    'Depósito observado. Ventas puede corregir el voucher.'
  )
}

function undo() {
  if (!props.deposit) return
  return run(
    () => PagoProveedorService.undoDeposit(props.deposit!.id).then(() => undefined),
    'La verificación quedó deshecha.'
  )
}

function extendObservation() {
  if (!props.deposit) return
  if (!extendReason.value.trim()) {
    showError('Extender plazo', 'Indica el motivo.')
    return
  }
  return run(
    () => PagoProveedorService.extendDepositObservation(props.deposit!.id, {
      reason: extendReason.value.trim(),
      days: Number(extendDays.value) || 7
    }).then(() => undefined),
    'Plazo extendido. Ventas puede seguir corrigiendo el voucher.'
  )
}

function cancelPayment() {
  if (!props.deposit) return
  if (!cancelReason.value.trim()) {
    showError('Anular pago', 'Indica el motivo.')
    return
  }
  return run(
    () => PagoProveedorService.cancelDepositPayment(props.deposit!.id, cancelReason.value.trim()).then(() => undefined),
    'Pago anulado.'
  )
}
</script>

<style scoped>
.boton-naranja {
  background: #f97316 !important;
  color: #fff !important;
}
</style>
