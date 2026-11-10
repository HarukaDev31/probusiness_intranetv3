<template>
  <UModal
    :open="open"
    :title="payment ? `Editar pago · ${payment.code}` : 'Registrar pago'"
    description="Reparte lo enviado entre las operaciones. Lo que no asignes queda como saldo a favor al confirmarse."
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
        <UFormField label="Fecha del pago" required>
          <UInput v-model="paidOn" type="date" class="w-full" />
        </UFormField>
        <UFormField label="Monto enviado (USD)" required>
          <UInputNumber v-model="amountSent" :min="0" :step="1" class="w-full" />
        </UFormField>

        <div class="sm:col-span-2">
          <div class="mb-2 flex items-center justify-between">
            <p class="text-sm font-medium text-highlighted">{{ isPartner ? 'Facturas a pagar' : 'Operaciones a pagar' }}</p>
            <UButton size="xs" color="neutral" variant="soft" icon="i-heroicons-sparkles" :disabled="!pending.length" @click="distribute">
              Distribuir automáticamente
            </UButton>
          </div>
          <USkeleton v-if="loadingPending" class="h-16 w-full" />
          <p v-else-if="!pending.length" class="text-sm text-muted">No hay operaciones con saldo pendiente.</p>
          <div
            v-for="operation in pending"
            :key="operation.id!"
            class="mb-2 grid grid-cols-[1fr_9rem] items-center gap-3 rounded-lg bg-elevated/50 px-3 py-2"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-highlighted">{{ operation.code }} · {{ operation.description }}</p>
              <p class="text-xs text-muted">Saldo pendiente {{ usd(operation.pending) }}</p>
            </div>
            <UInputNumber v-model="amounts[operation.id!]" :min="0" :max="operation.pending" :step="1" />
          </div>
        </div>

        <div class="sm:col-span-2">
          <p class="mb-1 text-sm font-medium text-highlighted">
            Comprobante<span v-if="isPartner" class="text-error"> *</span>
          </p>
          <YuanFilePick label="Adjuntar comprobante (PDF o imagen)" :accept="RECEIPT_ACCEPT" :current-name="payment?.receipt_name" @pick="receipt = $event" />
        </div>

        <UAlert v-if="errorMessage" class="sm:col-span-2" color="error" variant="subtle" icon="i-heroicons-exclamation-triangle" :description="errorMessage" />
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="outline" :disabled="saving" @click="emit('close')">Cancelar</UButton>
        <UButton color="primary" :loading="saving" @click="save">{{ payment ? 'Guardar cambios' : 'Registrar pago' }}</UButton>
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
