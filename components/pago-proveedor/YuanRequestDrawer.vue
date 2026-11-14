<template>
  <USlideover
    :open="!!request"
    :dismissible="false"
    :title="request ? `Socio ${request.partner_name || request.organization || request.country}` : ''"
    :description="request ? `${rmb(request.yuan_total)} · ${usd(request.usd_total)} · TC ${request.exchange_rate}` : ''"
    :ui="{ content: 'w-full max-w-[580px]', body: 'flex flex-col gap-4 bg-muted' }"
    @update:open="(value) => { if (!value) emit('close') }"
  >
    <template #header>
      <div v-if="request" class="flex w-full items-start justify-between gap-3">
        <div class="flex flex-col gap-0.5">
          <span class="text-sm text-muted">{{ request.code }} · {{ dayLabel(request.date) }}</span>
          <span class="text-xl font-semibold text-highlighted">Socio {{ request.partner_name || request.organization || request.country }}</span>
          <span class="text-sm text-toned">{{ rmb(request.yuan_total) }} · {{ usd(request.usd_total) }} · TC {{ request.exchange_rate }}</span>
        </div>
        <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" aria-label="Cerrar" @click="emit('close')" />
      </div>
    </template>
    <template #body>
      <template v-if="request">
        <div class="flex items-baseline justify-between gap-3">
          <div class="flex flex-col gap-0.5">
            <span class="font-semibold text-highlighted">Proveedores</span>
            <span class="text-xs text-muted">Cada proveedor avanza por separado: puedes pagar uno aunque otro esté observado.</span>
          </div>
          <UButton v-if="request.can_edit" color="primary" variant="link" class="shrink-0" @click="emit('edit', request)">Editar solicitud</UButton>
        </div>

        <div v-for="provider in request.providers" :key="provider.provider_id" class="flex flex-col gap-3 rounded-lg bg-default p-4 ring ring-default">
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 flex-col gap-0.5 text-sm text-toned">
              <span class="text-base font-semibold text-highlighted">{{ provider.supplier_code || 'Sin código' }}<template v-if="provider.supplier_name"> · {{ provider.supplier_name }}</template></span>
              <span>WeChat ID: <strong>{{ provider.wechat || '—' }}</strong></span>
              <span>Cliente del socio: <strong>{{ provider.client || '—' }}</strong></span>
              <span>T. producto: <strong>{{ provider.product || '—' }}</strong></span>
              <span>Vendedor: <strong>{{ provider.seller_name || '—' }}</strong></span>
              <span v-if="provider.consolidation">Consolidado: <strong>{{ provider.consolidation }}</strong></span>
            </div>
            <UBadge :color="statusColor(provider.status)" variant="soft" :label="provider.status_label" class="shrink-0" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col">
              <span class="text-xs text-muted">A PAGAR</span>
              <span class="text-lg font-bold text-highlighted">{{ rmb(provider.yuan_amount) }}</span>
              <span class="text-xs text-muted">≈ {{ usd(provider.usd_amount) }}</span>
              <span v-if="provider.supplier_payments > 1" class="text-xs text-muted">Pago {{ provider.current_payment }} de {{ provider.supplier_payments }}</span>
            </div>
            <div class="flex min-w-0 flex-col gap-1">
              <span class="text-xs text-muted">PROFORMA / PI</span>
              <span class="flex min-w-0 items-center gap-1.5 text-sm" :class="provider.proforma_url ? 'text-highlighted' : 'text-muted'">
                <UIcon name="i-heroicons-paper-clip" class="size-3.5 shrink-0 text-primary" />
                <span class="truncate">{{ provider.proforma_name || (provider.proforma_url ? 'Proforma' : 'Sin PI adjunta') }}</span>
              </span>
              <div v-if="provider.proforma_url" class="flex gap-2">
                <UButton size="xs" color="primary" variant="outline" icon="i-heroicons-eye" @click="viewer = { url: provider.proforma_url, name: provider.proforma_name }">Ver</UButton>
                <UButton size="xs" color="neutral" variant="outline" icon="i-heroicons-arrow-down-tray" :to="provider.proforma_url" target="_blank" rel="noopener">Descargar</UButton>
              </div>
            </div>
          </div>

          <template v-if="provider.status === YUAN_STATUS.OBSERVED">
            <div class="flex flex-col gap-2 rounded-lg bg-error/10 px-3.5 py-3">
              <span class="text-sm font-semibold text-error">Observación<template v-if="provider.observation_until_text"> · {{ provider.observation_until_text }}</template></span>
              <span class="text-sm text-highlighted">{{ provider.observation_detail || provider.observation_label }}</span>
              <span class="text-xs text-muted">{{ provider.manual ? 'El socio' : 'Ventas' }} debe corregir este proveedor; al guardar vuelve a Pendiente. Los demás proveedores siguen su curso.</span>
            </div>
            <div class="flex gap-2">
              <UButton color="neutral" variant="outline" :loading="saving" @click="lift(provider.provider_id)">Quitar observación</UButton>
            </div>
          </template>

          <template v-if="provider.status === YUAN_STATUS.PENDING">
            <div v-if="activeId !== provider.provider_id" class="flex gap-2">
              <UButton color="neutral" variant="outline" @click="startObserve(provider)">Observar</UButton>
              <UButton color="primary" @click="startPay(provider)">Registrar pago</UButton>
            </div>
            <template v-else-if="mode === 'observe'">
              <UFormField :label="`¿Qué debe corregir ${provider.manual ? 'el socio' : 'Ventas'}?`">
                <UTextarea v-model="note" :rows="3" placeholder="ej. El WeChat ID no coincide con la PI" class="w-full" />
              </UFormField>
              <div class="flex justify-end gap-2">
                <UButton color="neutral" variant="outline" @click="cancel">Cancelar</UButton>
                <UButton color="error" :loading="saving" :disabled="!note.trim()" @click="observe(provider.provider_id)">Marcar observado</UButton>
              </div>
            </template>
            <template v-else-if="mode === 'pay'">
              <div class="grid grid-cols-2 gap-3">
                <UFormField label="RMB pagado al proveedor">
                  <UInput v-model.number="yuanPaid" type="number" min="0" step="0.01" class="w-full font-semibold" />
                </UFormField>
                <UFormField label="Fecha de pago">
                  <UInput v-model="paidOn" type="date" class="w-full" />
                </UFormField>
              </div>
              <YuanFilePick
                :label="provider.needs_receipt ? 'Adjuntar constancia del pago' : 'Adjuntar voucher del pago (opcional)'"
                accept="image/*,.pdf"
                @pick="(file) => receipt = file"
              />
              <p v-if="provider.needs_notice && !request.incomes.length" class="rounded-lg bg-warning/10 px-3.5 py-3 text-sm text-highlighted">
                Primero registra el dinero recibido: el tipo de cambio real sale de ese ingreso.
              </p>
              <div v-if="provider.needs_notice" class="flex flex-col gap-2 rounded-lg bg-muted px-3.5 py-3">
                <span class="text-sm font-semibold text-highlighted">Aviso al cliente</span>
                <!-- eslint-disable-next-line vue/no-v-html -->
                <pre class="whitespace-pre-wrap font-sans text-sm" v-html="whatsappHtml(notice) || 'Cargando aviso…'" />
                <span class="text-xs text-muted">Sin importe y sin código de solicitud. Si cambias los yuanes pagados, vuelve a enviarlo.</span>
                <UButton class="self-start" color="neutral" variant="outline" :loading="saving" :disabled="!(yuanPaid > 0) || noticeReady" @click="sendNotice(provider.provider_id)">
                  {{ noticeReady ? 'Aviso enviado' : 'Enviar aviso al cliente' }}
                </UButton>
              </div>
              <div class="flex justify-end gap-2">
                <UButton color="neutral" variant="outline" @click="cancel">Cancelar</UButton>
                <UButton color="primary" :loading="saving" :disabled="!canPay(provider)" @click="pay(provider.provider_id)">Confirmar pago</UButton>
              </div>
            </template>
          </template>

          <template v-if="provider.status === YUAN_STATUS.PAID">
            <div class="grid grid-cols-2 gap-2.5 rounded-lg bg-success/10 px-3.5 py-3 text-sm text-highlighted">
              <span>Pagado <strong>{{ rmb(provider.yuan_paid) }}</strong></span>
              <span>{{ dayLabel(provider.paid_on) }} {{ provider.paid_on?.slice(0, 4) }}</span>
              <span class="col-span-2 flex items-center gap-1.5">
                <UIcon name="i-heroicons-paper-clip" class="size-3.5 shrink-0 text-primary" />
                <a v-if="provider.receipt_url" :href="provider.receipt_url" target="_blank" rel="noopener" class="truncate font-medium text-primary">{{ provider.receipt_name || 'Voucher' }}</a>
                <span v-else>Sin voucher adjunto</span>
              </span>
            </div>
            <UButton v-if="provider.can_undo" class="self-start" color="primary" variant="link" :padded="false" :loading="saving" @click="undo(provider)">Deshacer pago</UButton>
          </template>
        </div>

        <div class="flex flex-col gap-3 rounded-lg bg-default p-4 ring ring-default">
          <div class="flex items-baseline justify-between">
            <span class="font-semibold text-highlighted">Dinero recibido del socio</span>
            <UButton v-if="!incomeOpen" color="primary" variant="link" :padded="false" @click="startIncome()">Registrar ingreso</UButton>
          </div>
          <div v-for="income in request.incomes" :key="income.id" class="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-default py-2.5 text-sm">
            <span class="flex flex-col gap-0.5">
              <span class="font-semibold text-highlighted">{{ usd(income.usd_amount) }} × {{ income.exchange_rate }}</span>
              <span class="text-xs text-muted">{{ dayLabel(income.received_on) }} ·
                <a v-if="income.receipt_url" :href="income.receipt_url" target="_blank" rel="noopener" class="text-primary">{{ income.receipt_name }}</a>
                <template v-else>Sin comprobante</template>
              </span>
            </span>
            <span class="font-semibold text-highlighted">{{ rmb(income.yuan_amount) }}</span>
            <UButton v-if="income.can_remove" size="xs" color="neutral" variant="ghost" icon="i-heroicons-x-mark" aria-label="Quitar ingreso" :loading="saving" @click="removeIncome(income.id)" />
            <span v-else />
          </div>
          <span v-if="!request.incomes.length && !incomeOpen" class="text-sm text-muted">Aún no se registró el dinero del socio.</span>
          <div v-if="incomeOpen" class="flex flex-col gap-3 rounded-lg bg-muted p-3.5">
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="USD recibido">
                <UInput v-model.number="incomeUsd" type="number" min="0" step="0.01" class="w-full font-semibold" />
              </UFormField>
              <UFormField label="Tipo de cambio del banco">
                <UInput v-model.number="incomeRate" type="number" min="0" step="0.0001" class="w-full font-semibold" />
              </UFormField>
            </div>
            <div class="flex items-baseline justify-between rounded-lg bg-primary/10 px-3.5 py-3">
              <span class="text-sm text-toned">RMB obtenido</span>
              <span class="text-xl font-bold text-highlighted">{{ incomePreview }}</span>
            </div>
            <YuanFilePick label="Adjuntar comprobante (opcional)" accept="image/*,.pdf" @pick="(file) => incomeReceipt = file" />
            <div class="flex justify-end gap-2">
              <UButton color="neutral" variant="outline" @click="incomeOpen = false">Cancelar</UButton>
              <UButton color="primary" :loading="saving" :disabled="!(incomeUsd > 0 && incomeRate > 0)" @click="saveIncome">Guardar ingreso</UButton>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-2.5 rounded-lg bg-default p-4 ring" :class="request.difference < 0 ? 'ring-error/40' : 'ring-default'">
          <span class="font-semibold text-highlighted">Balance</span>
          <div class="flex justify-between text-sm"><span class="text-toned">RMB obtenido de los USD del socio</span><span class="font-semibold text-highlighted">{{ rmb(request.yuan_obtained) }}</span></div>
          <div class="flex justify-between text-sm"><span class="text-toned">RMB pagado a proveedores</span><span class="font-semibold text-highlighted">− {{ rmb(request.yuan_paid) }}</span></div>
          <div class="flex justify-between text-sm"><span class="text-toned">RMB por pagar</span><span class="font-semibold text-highlighted">− {{ rmb(request.yuan_pending) }}</span></div>
          <USeparator />
          <div class="flex items-baseline justify-between" :class="balanceColor">
            <span class="font-semibold">{{ balanceLabel }}</span>
            <span class="flex flex-col items-end">
              <span class="text-xl font-bold">{{ rmb(Math.abs(request.difference)) }}</span>
              <span v-if="request.difference" class="text-xs text-muted">≈ {{ usd(request.difference_usd) }} al TC {{ request.last_rate }}</span>
            </span>
          </div>
          <UButton v-if="request.difference < 0 && !incomeOpen" class="self-start" color="error" @click="startIncome(request.difference_usd, request.last_rate)">Registrar cobro de la diferencia</UButton>
        </div>
      </template>
    </template>
  </USlideover>
  <VoucherViewerModal
    :open="!!viewer"
    :url="viewer?.url || null"
    :name="viewer?.name"
    title="Proforma / PI"
    @close="viewer = null"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import VoucherViewerModal from '~/components/pago-proveedor/VoucherViewerModal.vue'
import YuanFilePick from '~/components/pago-proveedor/YuanFilePick.vue'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { YUAN_STATUS } from '~/constants/supplierPayment'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import type { SupplierPaymentYuan, SupplierPaymentYuanRequest } from '~/types/pago-proveedor'

const props = defineProps<{ request: SupplierPaymentYuanRequest | null }>()
const emit = defineEmits<{ close: []; changed: []; edit: [request: SupplierPaymentYuanRequest] }>()

const { showError, showConfirmation } = useModal()
const { withSpinner } = useSpinner()

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })

const saving = ref(false)
const activeId = ref<number | null>(null)
const mode = ref<'observe' | 'pay' | null>(null)
const note = ref('')
const yuanPaid = ref(0)
const paidOn = ref(today())
const receipt = ref<File | null>(null)
const notice = ref('')
const noticeSentFor = ref<number | null>(null)
const incomeOpen = ref(false)
const incomeUsd = ref(0)
const incomeRate = ref(0)
const incomeReceipt = ref<File | null>(null)
const viewer = ref<{ url: string; name: string | null } | null>(null)

watch(() => props.request?.request_id, () => {
  cancel()
  incomeOpen.value = false
})

const noticeReady = computed(() => noticeSentFor.value !== null && noticeSentFor.value === roundTwo(Number(yuanPaid.value || 0)))
const incomePreview = computed(() => incomeUsd.value > 0 && incomeRate.value > 0 ? rmb(roundTwo(incomeUsd.value * incomeRate.value)) : '—')
const balanceColor = computed(() => {
  const value = props.request?.difference || 0
  if (!value) return 'text-highlighted'
  return value < 0 ? 'text-error' : 'text-success'
})
const balanceLabel = computed(() => {
  switch (props.request?.difference_status) {
    case 'collect': return 'Diferencia a cobrar al socio'
    case 'missing': return 'Falta recibir del socio'
    case 'favor': return 'Excedente a favor del socio'
    default: return 'Cuadrado'
  }
})

function statusColor(status: string): 'primary' | 'error' | 'success' {
  if (status === YUAN_STATUS.PAID) return 'success'
  return status === YUAN_STATUS.OBSERVED ? 'error' : 'primary'
}

function cancel() {
  activeId.value = null
  mode.value = null
  note.value = ''
  receipt.value = null
  notice.value = ''
  noticeSentFor.value = null
}

function startObserve(provider: SupplierPaymentYuan) {
  cancel()
  activeId.value = provider.provider_id
  mode.value = 'observe'
}

async function startPay(provider: SupplierPaymentYuan) {
  cancel()
  activeId.value = provider.provider_id
  mode.value = 'pay'
  yuanPaid.value = provider.yuan_amount
  paidOn.value = today()
  if (!provider.needs_notice) return
  try {
    const response = await PagoProveedorService.yuanNoticeText(provider.provider_id)
    notice.value = response.data?.message || ''
  } catch (error: any) {
    showError('Aviso al cliente', error?.data?.message || 'No se pudo armar el aviso.')
  }
}

function canPay(provider: SupplierPaymentYuan) {
  if (!(yuanPaid.value > 0)) return false
  if (!provider.needs_notice) return true
  return !!props.request?.incomes.length && !!receipt.value && noticeReady.value
}

async function run(title: string, spinner: string, action: () => Promise<unknown>) {
  saving.value = true
  try {
    await withSpinner(action, spinner)
    cancel()
    emit('changed')
  } catch (error: any) {
    showError(title, error?.data?.message || 'No se pudo completar la operación.')
  } finally {
    saving.value = false
  }
}

async function sendNotice(providerId: number) {
  const paid = roundTwo(Number(yuanPaid.value || 0))
  saving.value = true
  try {
    await withSpinner(() => PagoProveedorService.confirmYuanNotice(providerId, paid), 'Enviando aviso…')
    noticeSentFor.value = paid
  } catch (error: any) {
    showError('Aviso al cliente', error?.data?.message || 'No se pudo guardar el aviso.')
  } finally {
    saving.value = false
  }
}

function pay(providerId: number) {
  return run('Pago', 'Registrando pago…', () => PagoProveedorService.registerYuan(providerId, {
    yuanPaid: yuanPaid.value,
    paidOn: paidOn.value,
    receipt: receipt.value
  }))
}

function observe(providerId: number) {
  return run('Observación', 'Guardando observación…', () => PagoProveedorService.observeYuan(providerId, { detail: note.value.trim() }))
}

function lift(providerId: number) {
  return run('Observación', 'Quitando observación…', () => PagoProveedorService.liftManualYuan(providerId))
}

function undo(provider: SupplierPaymentYuan) {
  const action = () => run('Pago', 'Deshaciendo pago…', () => PagoProveedorService.undoYuan(provider.provider_id))
  if (provider.manual) return action()
  showConfirmation('Deshacer pago', 'El cliente ya recibió el aviso de pago y este proveedor saldrá de Confirmación en Ventas. ¿Deshacer el pago?', action)
}

function startIncome(amount?: number, rate?: number) {
  if (!props.request) return
  incomeUsd.value = amount ?? roundTwo(Math.max(0, props.request.usd_total - props.request.usd_received))
  incomeRate.value = rate ?? props.request.exchange_rate
  incomeReceipt.value = null
  incomeOpen.value = true
}

async function saveIncome() {
  if (!props.request) return
  const requestId = props.request.request_id
  await run('Ingreso', 'Guardando ingreso…', () => PagoProveedorService.addYuanIncome(requestId, {
    usd: incomeUsd.value,
    rate: incomeRate.value,
    receipt: incomeReceipt.value
  }))
  incomeOpen.value = false
}

function removeIncome(incomeId: number) {
  return run('Ingreso', 'Quitando ingreso…', () => PagoProveedorService.removeYuanIncome(incomeId))
}
</script>
