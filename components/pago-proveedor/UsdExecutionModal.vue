<template>
  <SupplierPaymentWindow
    :open="payment !== null"
    :title="payment?.can_register ? 'Ejecución de pago' : 'Pago ejecutado'"
    :subtitle="subtitle"
    :code="payment?.request_code"
    :hint="hintText"
    wide
    @close="emit('close')"
  >
    <template #pill>
      <UBadge
        :color="payment?.can_register ? 'warning' : 'success'"
        variant="soft"
        :label="payment?.can_register ? 'Pendiente · listo para ejecutar' : '✓ Ejecutado'"
      />
    </template>

    <template v-if="payment">
      <div class="grid gap-4 lg:grid-cols-2">
        <SupplierPaymentCard title="Solicitud">
          <SupplierPaymentFact label="Cliente" :value="payment.client_name || '—'" />
          <SupplierPaymentFact label="Código de proveedor" :value="payment.supplier_code || '—'" />
          <SupplierPaymentFact label="Proveedor" :value="payment.supplier_name || '—'" />
          <SupplierPaymentFact label="Producto" :value="payment.product || '—'" />
          <SupplierPaymentFact label="Tipo de pago" :value="paymentTypeLabel" />
          <SupplierPaymentFact label="Modalidad" :value="modalityLabel" />
          <div v-if="payment.proforma_url" class="flex items-center justify-between gap-3 border-b border-default py-1.5 last:border-0">
            <span class="text-xs text-muted">Proforma</span>
            <span class="flex items-center gap-1">
              <UButton size="xs" color="neutral" variant="ghost" icon="i-heroicons-eye" title="Ver proforma" aria-label="Ver proforma" @click="openPreview(payment.proforma_url, payment.proforma_name, 'Proforma')" />
              <UButton size="xs" color="neutral" variant="ghost" icon="i-heroicons-arrow-down-tray" title="Descargar proforma" aria-label="Descargar proforma" :to="payment.proforma_url" target="_blank" rel="noopener" />
            </span>
          </div>
        </SupplierPaymentCard>

        <SupplierPaymentCard title="Importes">
          <p class="text-3xl font-bold text-primary">${{ money(payment.cargo_amount) }}</p>
          <div class="flex flex-wrap gap-1.5">
            <UBadge color="info" variant="soft" label="USD" />
            <UBadge v-if="payment.installment_label" color="info" variant="soft" :label="payment.installment_label" />
          </div>
          <p class="text-xs text-muted">Importe a pagar al proveedor (valor de la carga).</p>
        </SupplierPaymentCard>
      </div>

      <UCard>
        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h4 class="text-[15px] font-bold">Datos bancarios del proveedor</h4>
          <div class="flex items-center gap-2">
            <UBadge v-if="payment.bank_ready" color="success" variant="soft" label="✓ Recibido" />
            <UBadge v-else color="error" variant="soft" label="Pendientes" />
            <UButton size="xs" color="neutral" variant="soft" icon="i-heroicons-clipboard-document" :disabled="!payment.bank_copy_text" @click="copy(payment.bank_copy_text, 'Todos los datos bancarios')">
              Copiar datos
            </UButton>
          </div>
        </div>
        <div v-if="bankGroups.length" class="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <div v-for="group in bankGroups" :key="group.title">
            <p class="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted">{{ group.title }}</p>
            <div
              v-for="field in group.fields"
              :key="field.label"
              class="flex items-center justify-between gap-2 border-b border-default py-1 last:border-0"
            >
              <span class="text-xs text-muted">{{ field.label }}</span>
              <span class="flex items-center gap-1 text-right text-sm font-semibold text-highlighted">
                <span class="font-mono">{{ field.value || '—' }}</span>
                <UButton
                  v-if="field.value"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-clipboard-document"
                  :title="`Copiar ${field.label}`"
                  :aria-label="`Copiar ${field.label}`"
                  @click="copy(field.value, field.label)"
                />
              </span>
            </div>
          </div>
        </div>
        <div v-else class="rounded-lg bg-elevated px-3 py-2 text-sm text-muted">
          Aún no están los datos bancarios del proveedor (T-T). Sin ellos no se puede registrar el pago.
        </div>
      </UCard>

      <UCard>
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h4 class="text-[15px] font-bold">Registro del pago</h4>
          <UBadge
            :color="payment.can_register ? 'warning' : 'success'"
            variant="soft"
            :label="payment.can_register ? 'Pendiente' : '✓ Registrado'"
          />
        </div>

        <div class="grid gap-5 lg:grid-cols-2">
          <div>
            <p class="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Comisiones del pago</p>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-[11px] uppercase tracking-wide text-muted">
                    <th class="pb-1.5 pr-2 font-semibold" />
                    <th class="pb-1.5 pr-2 text-right font-semibold">Cobrado al cliente</th>
                    <th class="pb-1.5 pr-2 text-right font-semibold">Ejecutado</th>
                    <th class="pb-1.5 text-right font-semibold">Ganancia</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-t border-default">
                    <td class="py-1.5 pr-2">Comisión bancaria</td>
                    <td class="py-1.5 pr-2 text-right">${{ money(payment.charged_bank_fee) }}</td>
                    <td class="py-1.5 pr-2 text-right">
                      <UInput
                        v-if="payment.can_register"
                        v-model.number="realFee"
                        type="number"
                        min="0"
                        step="0.01"
                        size="xs"
                        placeholder="0.00"
                        class="w-24"
                        aria-label="Comisión bancaria real (la que cobró el banco) en USD"
                      />
                      <span v-else>${{ money(payment.real_bank_fee || 0) }}</span>
                    </td>
                    <td class="py-1.5 text-right font-semibold" :class="bankTone">{{ realFee === null ? '—' : signed(money(shownDifference)) }}</td>
                  </tr>
                  <tr class="border-t border-default">
                    <td class="py-1.5 pr-2">Comisión administrativa</td>
                    <td class="py-1.5 pr-2 text-right">${{ money(payment.charged_admin_fee) }}</td>
                    <td class="py-1.5 pr-2 text-right text-muted">Sin costo</td>
                    <td class="py-1.5 text-right font-semibold text-success">+${{ money(payment.charged_admin_fee) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="border-t border-default font-bold">
                    <td class="py-1.5 pr-2">Total</td>
                    <td class="py-1.5 pr-2 text-right">${{ money(totalCharged) }}</td>
                    <td class="py-1.5 pr-2 text-right">{{ realFee === null ? '—' : `$${money(realFee)}` }}</td>
                    <td class="py-1.5 text-right" :class="profitTone">{{ realFee === null ? '—' : signed(money(shownProfit)) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p class="mt-2 text-xs text-muted">
              Ingresa la comisión bancaria real (lo que te cobró el banco) para calcular la ganancia.
            </p>
            <div
              class="mt-2 flex items-center gap-2 rounded-lg border px-3 py-2"
              :class="profitCard.class"
            >
              <UIcon name="i-heroicons-arrow-trending-up" class="size-5 shrink-0" />
              <div class="min-w-0 flex-1">
                <p class="text-xs font-bold">{{ profitCard.title }}</p>
                <p class="text-[11px] text-muted">{{ profitCard.subtitle }}</p>
              </div>
              <p class="text-lg font-bold" :class="profitTone">{{ realFee === null ? '—' : signed(money(shownProfit)) }}</p>
            </div>
          </div>

          <div>
            <p class="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Constancia del pago al proveedor</p>

            <div v-if="!payment.can_register" class="rounded-lg border border-default px-3 py-2">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold">{{ payment.receipt_name || 'Constancia' }}</p>
                  <p class="text-xs text-muted">Ejecutado el {{ executedOn }}</p>
                </div>
                <UButton
                  v-if="payment.receipt_url"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-eye"
                  title="Ver constancia"
                  aria-label="Ver constancia"
                  @click="openPreview(payment.receipt_url, payment.receipt_name, 'Constancia de pago')"
                />
              </div>
            </div>

            <template v-else>
              <label
                class="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed px-3 py-4 text-center transition"
                :class="receipt ? 'border-success bg-success/10' : 'border-default hover:border-primary'"
              >
                <UIcon :name="receipt ? 'i-heroicons-check-circle' : 'i-heroicons-paper-clip'" class="size-5" :class="receipt ? 'text-success' : 'text-muted'" />
                <span class="text-sm font-semibold">{{ receipt ? receipt.name : 'Ningún archivo seleccionado' }}</span>
                <span class="text-xs text-muted">{{ receipt ? 'Cambiar archivo' : 'PDF, JPG o PNG' }}</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  class="hidden"
                  @change="onFile"
                >
              </label>

              <div class="mt-3 rounded-lg border border-default px-3 py-2">
                <div class="mb-1 flex items-center justify-between gap-2">
                  <p class="text-xs font-bold">Aviso al cliente</p>
                  <UButton size="xs" color="neutral" variant="ghost" icon="i-heroicons-clipboard-document" :disabled="!receipt" title="Copiar aviso" @click="copy(notice, 'Aviso al cliente')" />
                </div>
                <!-- eslint-disable-next-line vue/no-v-html -->
                <pre class="max-h-32 overflow-auto whitespace-pre-wrap font-sans text-[11px] leading-snug" v-html="whatsappHtml(notice) || 'Cargando aviso…'" />
                <p v-if="noticeSent" class="mt-1 flex items-center gap-1 text-xs font-semibold text-success">
                  <UIcon name="i-heroicons-check-circle" class="size-4" /> Mensaje enviado al cliente
                </p>
                <p v-else-if="!receipt" class="mt-1 text-xs text-muted">Adjunta la constancia para habilitar el envío.</p>
                <UButton
                  v-if="!noticeSent"
                  class="mt-2"
                  size="xs"
                  color="warning"
                  variant="soft"
                  icon="i-mdi-whatsapp"
                  :loading="saving"
                  :disabled="!receipt"
                  @click="sendNotice"
                >
                  Enviar mensaje por WhatsApp
                </UButton>
              </div>
            </template>
          </div>
        </div>
      </UCard>
    </template>

    <template #footer>
      <UButton color="neutral" variant="ghost" @click="emit('close')">
        {{ payment?.can_register ? 'Cancelar' : 'Cerrar' }}
      </UButton>
      <UButton
        v-if="payment?.can_register"
        color="warning"
        :loading="saving"
        :disabled="!canSave"
        :title="saveDisabledReason"
        @click="save"
      >
        Registrar pago ejecutado
      </UButton>
    </template>

  </SupplierPaymentWindow>

  <VoucherViewerModal
    :open="!!previewOpen"
    :url="previewOpen?.url || null"
    :name="previewOpen?.name || null"
    :title="previewOpen?.title || 'Comprobante'"
    @close="previewOpen = null"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SupplierPaymentCard from '~/components/pago-proveedor/SupplierPaymentCard.vue'
import SupplierPaymentFact from '~/components/pago-proveedor/SupplierPaymentFact.vue'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'
import VoucherViewerModal from '~/components/pago-proveedor/VoucherViewerModal.vue'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import type { SupplierPaymentExecution } from '~/types/pago-proveedor'
import { useModal } from '~/composables/commons/useModal'
import { whatsappHtml } from '~/utils/whatsappFormat'

const props = defineProps<{ payment: SupplierPaymentExecution | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { showSuccess, showError } = useModal()

const realFee = ref<number | null>(null)
const receipt = ref<File | null>(null)
const saving = ref(false)
const notice = ref('')
const noticeSent = ref(false)
const previewOpen = ref<{ url: string | null; name: string | null; title: string } | null>(null)

/** Etiquetas: el backend ya manda el tipo legible y la modalidad de la maqueta. */
const paymentTypeLabel = computed(() => props.payment?.payment_type_label
  || (props.payment?.currency === 'RMB' ? 'RMB / Transferencia' : 'USD / T-T'))
/** Maqueta: «2 cuotas 50%–50% · cuota 1 de 2». La modalidad ya trae la cuota; se usa la de este pago sin repetirla. */
const modalityLabel = computed(() => {
  const base = (props.payment?.modality_label || '').replace(/\s*·\s*cuota \d+ de \d+\s*$/i, '').trim()
  const parts = [base].filter(Boolean)
  if (props.payment?.installment_label) parts.push(props.payment.installment_label.toLowerCase())
  return parts.join(' · ') || 'Total'
})

/** Solo el número de consolidado, sin el año: «21 - 2026» → «21». */
function soloConsolidado(value: string) {
  return value.replace(/\s*-\s*\d{4}\s*$/, '').trim() || value
}

const subtitle = computed(() => {
  if (!props.payment) return ''
  const parts = [
    props.payment.client_name || 'Cliente',
    `Consolidado ${props.payment.consolidation ? soloConsolidado(props.payment.consolidation) : 'sin identificar'}`
  ]
  if (props.payment.installment_label) parts.push(props.payment.installment_label)
  return parts.join(' · ')
})

const hintText = computed(() => (props.payment?.can_register
  ? 'Adjunta la constancia, envía el aviso al cliente por WhatsApp y recién entonces registra el pago.'
  : ''))

const executedOn = computed(() => {
  const value = props.payment?.executed_on
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-PE')
})

/** Datos bancarios agrupados como la maqueta: beneficiario, banco de destino e intermediario. */
const bankGroups = computed(() => {
  const bank = props.payment?.bank
  if (!bank) return []
  const groups: Array<{ title: string; fields: Array<{ label: string; value: string | null }> }> = [
    {
      title: 'Datos del beneficiario (proveedor)',
      fields: [
        { label: 'Nombre del beneficiario', value: bank.beneficiary_name },
        { label: 'Número de cuenta', value: bank.beneficiary_account },
        { label: 'Dirección del beneficiario', value: bank.beneficiary_address },
        { label: 'País', value: bank.beneficiary_country },
        { label: 'Ciudad', value: bank.beneficiary_city }
      ]
    },
    {
      title: 'Datos del banco de destino',
      fields: [
        { label: bank.bank_code_type || 'Código de banco', value: bank.bank_code },
        { label: 'Nombre del banco', value: bank.bank_name },
        { label: 'Dirección de banco pagador', value: bank.bank_address },
        { label: 'País', value: bank.bank_country },
        { label: 'Ciudad', value: bank.bank_city }
      ]
    }
  ]
  if (bank.uses_intermediary) {
    groups.push({
      title: 'Datos del banco intermediario',
      fields: [
        { label: bank.intermediary_code_type || 'Código de banco', value: bank.intermediary_code },
        { label: 'Nombre del banco', value: bank.intermediary_name },
        { label: 'Dirección de banco pagador', value: bank.intermediary_address },
        { label: 'País', value: bank.intermediary_country },
        { label: 'Ciudad', value: bank.intermediary_city }
      ]
    })
  }
  return groups.filter((group) => group.fields.some((field) => field.value))
})

const totalCharged = computed(() => Number((
  Number(props.payment?.charged_bank_fee || 0) + Number(props.payment?.charged_admin_fee || 0)
).toFixed(2)))

const shownDifference = computed(() => {
  if (!props.payment) return 0
  if (!props.payment.can_register) return props.payment.bank_difference || 0
  if (realFee.value === null || Number.isNaN(realFee.value)) return 0
  return Math.round((Number(props.payment.charged_bank_fee) - Number(realFee.value)) * 100) / 100
})

const shownProfit = computed(() => {
  if (!props.payment) return 0
  if (!props.payment.can_register) return props.payment.profit || 0
  return Math.round((shownDifference.value + Number(props.payment.charged_admin_fee)) * 100) / 100
})

const bankTone = computed(() => tone(shownDifference.value))
const profitTone = computed(() => tone(shownProfit.value))

function tone(value: number) {
  if (value > 0.004) return 'text-success'
  if (value < -0.004) return 'text-error'
  return 'text-highlighted'
}

const profitCard = computed(() => {
  const value = shownProfit.value
  if (realFee.value === null && props.payment?.can_register) {
    return {
      class: 'border-default bg-elevated',
      title: 'Ganancia de Pro Business en este pago',
      subtitle: 'Ingresa la comisión bancaria real para calcularla.'
    }
  }
  if (value < -0.004) {
    return {
      class: 'border-error/40 bg-error/10',
      title: 'Pérdida de Pro Business en este pago',
      subtitle: 'Total cobrado al cliente − total ejecutado.'
    }
  }
  return {
    class: value > 0.004 ? 'border-success/40 bg-success/10' : 'border-default bg-elevated',
    title: 'Ganancia de Pro Business en este pago',
    subtitle: 'Total cobrado al cliente − total ejecutado.'
  }
})

const canSave = computed(() => !!props.payment?.can_register
  && props.payment.bank_ready
  && noticeSent.value
  && receipt.value !== null
  && realFee.value !== null
  && Number.isFinite(Number(realFee.value))
  && Number(realFee.value) >= 0
  && !saving.value)

const saveDisabledReason = computed(() => {
  if (!props.payment) return ''
  if (!props.payment.bank_ready) return 'Faltan los datos bancarios del proveedor (T-T)'
  if (!receipt.value) return 'Adjunta la constancia del pago'
  if (realFee.value === null) return 'Ingresa la comisión bancaria real'
  if (!noticeSent.value) return 'Primero envía la constancia al cliente por WhatsApp'
  return ''
})

watch(() => props.payment?.provider_id, async (id) => {
  realFee.value = props.payment?.can_register ? null : (props.payment?.real_bank_fee ?? null)
  receipt.value = null
  notice.value = ''
  noticeSent.value = false
  previewOpen.value = null
  if (!props.payment?.can_register || !id) return
  try {
    const response = await PagoProveedorService.executionNoticeText(id, Number(props.payment.cargo_amount || 0))
    notice.value = response.data?.message || ''
  } catch {
    notice.value = ''
  }
}, { immediate: true })

function openPreview(url: string | null, name: string | null, title: string) {
  if (!url) return
  previewOpen.value = { url, name, title }
}

function money(value: number | null | undefined) {  return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function signed(value: string) {
  const numeric = Number(value.replace(/,/g, ''))
  return numeric > 0.004 ? `+$${value}` : (numeric < -0.004 ? `−$${value.replace('-', '')}` : `$${value}`)
}

async function copy(value: string | null | undefined, label: string) {
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
    showSuccess('Copiar', `${label} copiado.`)
  } catch {
    showError('Copiar', 'No se pudo copiar en este navegador.')
  }
}

function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null
  if (file && !/\.(pdf|jpe?g|png)$/i.test(file.name)) {
    input.value = ''
    showError('Constancia', 'Formato no permitido. Usa PDF, JPG o PNG.')
    return
  }
  receipt.value = file
  noticeSent.value = false
}

async function sendNotice() {
  if (!props.payment || noticeSent.value || !receipt.value) return
  saving.value = true
  try {
    await PagoProveedorService.confirmExecutionNotice(props.payment.provider_id, Number(props.payment.cargo_amount || 0))
    noticeSent.value = true
    showSuccess('Aviso', 'Mensaje enviado. Ya puedes registrar el pago.')
  } catch (error: any) {
    showError('Aviso', error?.data?.message || error?.message || 'No se pudo guardar el aviso.')
  } finally {
    saving.value = false
  }
}

async function save() {
  if (!props.payment || realFee.value === null || !receipt.value || !canSave.value) return
  saving.value = true
  try {
    await PagoProveedorService.registerExecution(props.payment.provider_id, Number(realFee.value), receipt.value)
    showSuccess('Ejecución de pago', 'La transferencia quedó registrada. El pago pasa a Confirmación.')
    emit('saved')
    emit('close')
  } catch (error: any) {
    showError('Ejecución de pago', error?.data?.message || error?.message || 'No se pudo registrar el pago.')
  } finally {
    saving.value = false
  }
}
</script>
