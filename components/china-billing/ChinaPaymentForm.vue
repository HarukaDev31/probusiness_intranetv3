<template>
  <UModal
    :open="open"
    :title="payment ? `Editar pago · ${payment.code}` : 'Registrar pago'"
    :description="isPartner ? 'Pro Business China confirmará el ingreso al recibir la transferencia.' : 'Una transferencia puede cubrir varias operaciones del mismo cliente.'"
    :dismissible="!saving"
    :ui="{ content: 'w-full max-w-2xl sm:max-w-2xl', header: 'border-t-[5px] border-t-primary-500', title: 'text-lg font-bold text-highlighted' }"
    @update:open="(value: boolean) => !value && emit('close')"
  >
    <template #body>
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField v-if="!isPartner" label="Cliente" required class="sm:col-span-2">
          <USelectMenu
            v-model="organizationId"
            :items="organizationItems"
            value-key="value"
            placeholder="Selecciona un cliente"
            :disabled="!!payment || !!lockedOrganizationId"
            class="w-full"
          />
        </UFormField>
        <UFormField :label="isPartner ? 'Monto transferido (USD)' : 'Monto enviado (USD)'" required :class="isPartner ? 'sm:order-1' : 'sm:order-2'">
          <UInputNumber :ui="{ increment: 'hidden', decrement: 'hidden', base: 'px-3 text-left' }" v-model="amountSent" :min="0" :step="0.01" placeholder="0.00" class="w-full" />
        </UFormField>

        <UFormField :label="isPartner ? 'Fecha de transferencia' : 'Fecha del pago'" required :class="isPartner ? 'sm:order-2' : 'sm:order-1'">
          <UInput v-model="paidOn" type="date" class="w-full" />
        </UFormField>
        <div class="sm:col-span-2" :class="isPartner ? 'sm:order-4' : 'sm:order-3'">
          <p v-if="!isPartner" class="mb-1 text-sm font-medium text-highlighted">Comprobante (opcional)</p>
          <div class="relative">
            <YuanFilePick :label="isPartner ? 'Adjuntar comprobante de la transferencia (PDF o imagen)' : 'Adjuntar comprobante (PDF o imagen)'" :accept="RECEIPT_ACCEPT" :current-name="payment?.receipt_name" @pick="receipt = $event" />
            <span v-if="isPartner" class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-primary">Obligatorio</span>
          </div>
        </div>

        <div class="sm:col-span-2" :class="isPartner ? 'sm:order-3' : 'sm:order-4'">
          <div class="mb-2 flex items-center justify-between gap-3">
            <p class="text-sm font-semibold text-highlighted">{{ isPartner ? 'Facturas que cubre este pago' : 'Aplicar a operaciones' }}</p>
            <UButton size="xs" color="primary" variant="link" class="font-semibold" :disabled="!pending.length" @click="distribute">
              Distribuir automáticamente
            </UButton>
          </div>
          <USkeleton v-if="loadingPending" class="h-16 w-full" />
          <p v-else-if="!pending.length" class="text-sm text-muted">No hay operaciones con saldo pendiente.</p>
          <div
            v-for="operation in pending"
            :key="operation.id!"
            class="mb-2 grid grid-cols-[auto_1fr_auto_8.5rem] items-center gap-3 rounded-lg border px-3 py-2"
            :class="covered(operation.id!) ? 'border-primary-400 bg-primary-50/70' : 'border-default bg-elevated/40'"
          >
            <UCheckbox
              :model-value="covered(operation.id!)"
              :aria-label="`Aplicar a ${operation.code}`"
              @update:model-value="(on: boolean) => toggleOperation(operation, on)"
            />
            <div class="min-w-0">
              <!-- #1909: como la maqueta, «OP-0004 · Consolidado» y debajo «02 oct · Consolidado #46 · producto». -->
              <p class="truncate text-sm font-semibold text-highlighted">{{ operation.code }} · {{ operation.service_name }}</p>
              <p class="truncate text-xs text-muted">{{ [dayLabel(operation.issued_on), operation.consolidado_label, operation.description].filter(Boolean).join(' · ') }}</p>
            </div>
            <span class="text-right text-xs font-semibold uppercase tracking-wide text-muted">
              {{ isPartner ? 'Saldo' : 'Pendiente' }}<br>
              <span class="text-sm normal-case tracking-normal text-highlighted">{{ usd(operation.pending) }}</span>
            </span>
            <UInputNumber :ui="{ increment: 'hidden', decrement: 'hidden', base: 'px-3 text-left' }" v-model="amounts[operation.id!]" :min="0" :max="operation.pending" :step="0.01" />
          </div>
        </div>

        <UAlert v-if="errorMessage" class="sm:order-5 sm:col-span-2" color="error" variant="subtle" icon="i-heroicons-exclamation-triangle" :description="errorMessage" />
      </div>
    </template>
    <template #footer>
      <div class="flex w-full flex-col gap-2">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div class="flex gap-6 text-sm">
            <div v-if="!isPartner">
              <p class="text-[11px] font-semibold uppercase tracking-wide text-muted">Enviado</p>
              <p class="font-bold text-highlighted">{{ usd(sentAmount) }}</p>
            </div>
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-wide text-muted">Asignado</p>
              <p class="font-bold text-highlighted">{{ usd(assignedAmount) }}</p>
            </div>
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-wide text-muted">Sin asignar</p>
              <p class="font-bold text-success">{{ usd(unassignedAmount) }}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <UButton color="neutral" variant="outline" :disabled="saving" @click="emit('close')">Cancelar</UButton>
            <UButton color="primary" :loading="saving" @click="save">{{ payment ? 'Guardar cambios' : (isPartner ? 'Enviar pago' : 'Registrar pago') }}</UButton>
          </div>
        </div>
        <p v-if="sentAmount > 0 && unassignedAmount <= 0.004" class="text-xs text-muted">Todo el monto está asignado.</p>
        <p v-else-if="unassignedAmount > 0.004" class="text-xs font-medium text-success">
          {{ usd(unassignedAmount) }} sin asignar quedará como saldo a favor de {{ clientLabel }} al confirmar el ingreso.
        </p>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import YuanFilePick from '~/components/pago-proveedor/YuanFilePick.vue'
import { RECEIPT_ACCEPT } from '~/constants/chinaBilling'
import { ChinaBillingService } from '~/services/chinaBillingService'
import type { ChinaOperation, ChinaOrganizationOption, ChinaPayment } from '~/types/china-billing'

const props = defineProps<{
  open: boolean
  /** partner: el socio registra para su organización. China: elige el cliente. */
  mode: 'china' | 'partner'
  organizations?: ChinaOrganizationOption[]
  payment?: ChinaPayment | null
  /** Cliente ya elegido (por ejemplo, desde las operaciones seleccionadas). */
  lockedOrganizationId?: number | null
  /** Operaciones preseleccionadas para repartir. */
  preselectedIds?: number[]
}>()

const emit = defineEmits<{ close: []; saved: [] }>()

const isPartner = computed(() => props.mode === 'partner')
const organizationId = ref<number | null>(null)
const paidOn = ref(new Date().toISOString().slice(0, 10))
const amountSent = ref<number | null>(null)
const amounts = ref<Record<number, number | null>>({})
const pending = ref<ChinaOperation[]>([])
const loadingPending = ref(false)
const receipt = ref<File | null>(null)
const saving = ref(false)
const errorMessage = ref('')

const organizationItems = computed(() => (props.organizations || []).map((org) => ({ value: org.id, label: `${org.name}${org.country ? ` · ${org.country}` : ''}` })))
const clientLabel = computed(() => organizationItems.value.find((item) => item.value === organizationId.value)?.label || 'el cliente')
const sentAmount = computed(() => Number(amountSent.value || 0))
const assignedAmount = computed(() => roundTwo(pending.value.reduce((sum, operation) => sum + Number(amounts.value[operation.id!] || 0), 0)))
const unassignedAmount = computed(() => roundTwo(Math.max(0, sentAmount.value - assignedAmount.value)))

function covered(id: number) {
  return Number(amounts.value[id] || 0) > 0.004
}

function toggleOperation(operation: ChinaOperation, on: boolean) {
  amounts.value = { ...amounts.value, [operation.id!]: on ? roundTwo(operation.pending || 0) : null }
}

watch(() => [props.open, props.payment, props.lockedOrganizationId], async () => {
  if (!props.open) return
  errorMessage.value = ''
  receipt.value = null
  amounts.value = {}
  pending.value = []
  paidOn.value = props.payment?.paid_on || new Date().toISOString().slice(0, 10)
  amountSent.value = props.payment?.amount_sent ?? null
  organizationId.value = props.payment?.organization.id ?? props.lockedOrganizationId ?? null
  if (isPartner.value || organizationId.value) await loadPending()
}, { immediate: true })

watch(organizationId, (value, old) => {
  if (!props.open || isPartner.value || !value || value === old) return
  amounts.value = {}
  loadPending()
})

async function loadPending() {
  loadingPending.value = true
  try {
    const response = isPartner.value
      ? await ChinaBillingService.partnerPayableInvoices()
      : await ChinaBillingService.pendingOperations(organizationId.value!)
    pending.value = response.data || []
    // Al editar, lo ya asignado a este pago vuelve a estar disponible para repartir.
    props.payment?.allocations.forEach((allocation) => {
      const operation = pending.value.find((item) => item.id === allocation.operation_id)
      if (operation) {
        operation.pending = (operation.pending || 0) + allocation.amount
        amounts.value[allocation.operation_id] = allocation.amount
      }
    })
    ;(props.preselectedIds || []).forEach((id) => {
      const operation = pending.value.find((item) => item.id === id)
      if (operation && amounts.value[id] == null) amounts.value[id] = operation.pending ?? null
    })
  } catch (error: any) {
    errorMessage.value = error?.message || 'No se pudieron cargar las operaciones.'
  } finally {
    loadingPending.value = false
  }
}

/** Reparte lo enviado por orden de antigüedad (el backend vuelve a validar cada monto). */
function distribute() {
  let left = Number(amountSent.value || 0)
  const next: Record<number, number | null> = {}
  pending.value.forEach((operation) => {
    const take = Math.min(left, operation.pending || 0)
    next[operation.id!] = take > 0 ? roundTwo(take) : null
    left = roundTwo(left - take)
  })
  amounts.value = next
}

async function save() {
  errorMessage.value = ''
  if (!isPartner.value && !organizationId.value) {
    errorMessage.value = 'Selecciona un cliente.'
    return
  }
  if (!amountSent.value || amountSent.value <= 0) {
    errorMessage.value = 'Indica el monto enviado.'
    return
  }
  if (isPartner.value && !receipt.value && !props.payment?.receipt_url) {
    errorMessage.value = 'Adjunta el comprobante del pago.'
    return
  }
  const allocations = Object.entries(amounts.value)
    .filter(([, amount]) => Number(amount) > 0)
    .map(([operationId, amount]) => ({ operation_id: Number(operationId), amount: Number(amount) }))
  if (isPartner.value && !allocations.length) {
    errorMessage.value = 'Elige al menos una factura para aplicar el pago.'
    return
  }

  saving.value = true
  try {
    const payload = {
      organization_id: organizationId.value || undefined,
      paid_on: paidOn.value,
      amount_sent: amountSent.value,
      allocations,
      receipt: receipt.value
    }
    if (props.payment) {
      if (isPartner.value) await ChinaBillingService.partnerUpdatePayment(props.payment.id, payload)
      else await ChinaBillingService.updatePayment(props.payment.id, payload)
    } else if (isPartner.value) {
      await ChinaBillingService.partnerCreatePayment(payload)
    } else {
      await ChinaBillingService.createPayment(payload)
    }
    emit('saved')
  } catch (error: any) {
    errorMessage.value = error?.message || 'No se pudo guardar el pago.'
  } finally {
    saving.value = false
  }
}
</script>
