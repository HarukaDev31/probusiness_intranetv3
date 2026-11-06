<template>
  <SupplierPaymentWindow
    :open="open"
    :title="request ? `Editar solicitud · ${request.code}` : 'Nueva solicitud de pago'"
    :subtitle="request ? 'Al guardar, los proveedores observados vuelven a Pendiente.' : 'Sin aviso a Ventas ni al cliente.'"
    width-class="max-w-[820px] sm:max-w-[820px]"
    @close="emit('close')"
  >
    <div class="grid gap-3.5 sm:grid-cols-4">
      <UFormField label="País">
        <USelect v-model="form.country" :items="countries" class="w-full" @update:model-value="form.partner = ''" />
      </UFormField>
      <UFormField label="Cliente">
        <UInput v-model="form.partner" list="yuan-partners" placeholder="Selecciona o escribe" class="w-full" />
      </UFormField>
      <UFormField label="Fecha">
        <UInput v-model="form.date" type="date" class="w-full" />
      </UFormField>
      <UFormField label="Tipo de cambio (RMB por USD)">
        <UInput v-model="form.rate" type="number" min="0" step="0.0001" class="w-full font-semibold" @update:model-value="onRate" />
      </UFormField>
    </div>

    <span class="font-semibold text-highlighted">Proveedores</span>
    <div
      v-for="(provider, index) in form.providers"
      :key="provider.key"
      class="flex flex-col gap-3 rounded-lg p-4 ring"
      :class="[provider.status === YUAN_STATUS.OBSERVED ? 'ring-error/40' : 'ring-default', provider.status === YUAN_STATUS.PAID ? 'bg-muted' : 'bg-default']"
    >
      <div class="flex items-center justify-between gap-2.5">
        <span class="text-sm font-semibold text-highlighted">Proveedor {{ index + 1 }}</span>
        <UButton v-if="form.providers.length > 1 && provider.status !== YUAN_STATUS.PAID" size="xs" color="error" variant="link" :padded="false" @click="form.providers.splice(index, 1)">Quitar</UButton>
      </div>
      <p v-if="provider.observation" class="rounded-lg bg-error/10 px-3 py-2.5 text-sm text-error">Observación de China: {{ provider.observation }}</p>
      <UFormField label="Cliente del socio">
        <UInput v-model="provider.client_name" list="yuan-clients" placeholder="Busca o escribe el nombre del cliente" class="w-full" />
      </UFormField>
      <div class="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <UFormField label="Nombre del proveedor">
          <UInput v-model="provider.supplier_name" placeholder="ej. Yiwu Hongda Trading" class="w-full" />
        </UFormField>
        <UFormField label="WeChat ID">
          <UInput v-model="provider.wechat" placeholder="ej. hongda_yiwu" class="w-full" />
        </UFormField>
        <UFormField label="T. producto">
          <UInput v-model="provider.product" placeholder="ej. Muebles de oficina" class="w-full" />
        </UFormField>
        <UFormField label="Nombre del vendedor">
          <UInput v-model="provider.seller_name" placeholder="ej. Lily Chen" class="w-full" />
        </UFormField>
      </div>
      <div class="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)]">
        <UFormField label="Monto USD">
          <UInput v-model="provider.usd" type="number" min="0" step="0.01" placeholder="0.00" class="w-full" :disabled="provider.status === YUAN_STATUS.PAID" @update:model-value="onUsd(provider)" />
        </UFormField>
        <UFormField label="Monto RMB a pagar">
          <UInput v-model="provider.yuan" type="number" min="0" step="0.01" placeholder="0.00" class="w-full font-semibold" :disabled="provider.status === YUAN_STATUS.PAID" @update:model-value="onYuan(provider)" />
        </UFormField>
        <UFormField label="Proforma / PI">
          <YuanFilePick label="Adjuntar PI" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" :current-name="provider.proformaName" @pick="(file) => provider.proforma = file" />
        </UFormField>
      </div>
    </div>
    <datalist id="yuan-partners">
      <option v-for="partner in partnersByCountry[form.country] || []" :key="partner" :value="partner" />
    </datalist>
    <datalist id="yuan-clients">
      <option v-for="client in clientsByCountry[form.country] || []" :key="client" :value="client" />
    </datalist>
    <UButton class="self-start" color="primary" variant="link" icon="i-heroicons-plus" :padded="false" @click="form.providers.push(blankProvider())">Agregar proveedor</UButton>

    <template #footer>
      <div class="mr-auto flex gap-7">
        <div class="flex flex-col"><span class="text-xs tracking-wider text-muted">TOTAL USD</span><span class="text-xl font-bold text-highlighted">{{ usd(totalUsd) }}</span></div>
        <div class="flex flex-col"><span class="text-xs tracking-wider text-muted">TOTAL RMB</span><span class="text-xl font-bold text-highlighted">{{ rmb(totalYuan) }}</span></div>
      </div>
      <UButton color="neutral" variant="outline" @click="emit('close')">Cancelar</UButton>
      <UButton color="primary" :loading="saving" :disabled="!valid" @click="save">{{ request ? 'Guardar cambios' : 'Crear solicitud' }}</UButton>
    </template>
  </SupplierPaymentWindow>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'
import YuanFilePick from '~/components/pago-proveedor/YuanFilePick.vue'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { YUAN_STATUS } from '~/constants/supplierPayment'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import type { SupplierPaymentYuanRequest } from '~/types/pago-proveedor'

interface ProviderDraft {
  key: string
  id: number | null
  status: string
  observation: string
  client_name: string
  supplier_name: string
  wechat: string
  product: string
  seller_name: string
  usd: string | number
  yuan: string | number
  proforma: File | null
  proformaName: string
}

const props = defineProps<{
  open: boolean
  request: SupplierPaymentYuanRequest | null
  countries: string[]
  partnersByCountry: Record<string, string[]>
  clientsByCountry: Record<string, string[]>
}>()
const emit = defineEmits<{ close: []; saved: [] }>()

const { showError, showSuccess } = useModal()
const { withSpinner } = useSpinner()

const saving = ref(false)
let nextKey = 0

const blankProvider = (): ProviderDraft => ({
  key: `new-${++nextKey}`,
  id: null,
  status: YUAN_STATUS.PENDING,
  observation: '',
  client_name: '',
  supplier_name: '',
  wechat: '',
  product: '',
  seller_name: '',
  usd: '',
  yuan: '',
  proforma: null,
  proformaName: ''
})

const form = reactive({
  country: '',
  partner: '',
  date: '',
  rate: '' as string | number,
  providers: [] as ProviderDraft[]
})

watch(() => props.open, (open) => {
  if (!open) return
  const request = props.request
  form.country = request?.country || props.countries[0] || ''
  form.partner = request?.partner || ''
  form.date = request?.date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
  form.rate = request?.exchange_rate ?? '7.10'
  form.providers = request
    ? request.providers.map((provider) => ({
      key: `id-${provider.provider_id}`,
      id: provider.provider_id,
      status: provider.status,
      observation: provider.status === YUAN_STATUS.OBSERVED ? (provider.observation_detail || provider.observation_label || '') : '',
      client_name: provider.client || '',
      supplier_name: provider.supplier_name || '',
      wechat: provider.wechat || '',
      product: provider.product || '',
      seller_name: provider.seller_name || '',
      usd: provider.usd_amount,
      yuan: provider.yuan_amount,
      proforma: null,
      proformaName: provider.proforma_name || ''
    }))
    : [blankProvider()]
})

const rateValue = computed(() => Number(form.rate) || 0)
const totalYuan = computed(() => roundTwo(form.providers.reduce((sum, provider) => sum + (Number(provider.yuan) || 0), 0)))
const totalUsd = computed(() => roundTwo(totalYuan.value / (rateValue.value || 1)))
const valid = computed(() => rateValue.value > 0 && !!form.partner.trim() && !!form.date && form.providers.length > 0
  && form.providers.every((provider) => provider.client_name.trim() && provider.supplier_name.trim() && provider.wechat.trim() && Number(provider.yuan) > 0))

function onRate() {
  form.providers.forEach((provider) => {
    if (provider.status !== YUAN_STATUS.PAID && rateValue.value > 0 && Number(provider.usd) > 0) {
      provider.yuan = roundTwo(Number(provider.usd) * rateValue.value)
    }
  })
}

function onUsd(provider: ProviderDraft) {
  const value = Number(provider.usd)
  provider.yuan = rateValue.value > 0 && value > 0 ? roundTwo(value * rateValue.value) : ''
}

function onYuan(provider: ProviderDraft) {
  const value = Number(provider.yuan)
  provider.usd = rateValue.value > 0 && value > 0 ? roundTwo(value / rateValue.value) : ''
}

async function save() {
  const body = new FormData()
  body.append('country', form.country)
  body.append('partner', form.partner)
  body.append('request_date', form.date)
  body.append('exchange_rate', String(form.rate))
  form.providers.forEach((provider, index) => {
    const field = (name: string) => `providers[${index}][${name}]`
    if (provider.id) body.append(field('id'), String(provider.id))
    body.append(field('client_name'), provider.client_name)
    body.append(field('supplier_name'), provider.supplier_name)
    body.append(field('wechat'), provider.wechat)
    body.append(field('product'), provider.product)
    body.append(field('seller_name'), provider.seller_name)
    body.append(field('yuan_amount'), String(provider.yuan))
    if (provider.proforma) body.append(field('proforma'), provider.proforma)
  })
  const requestId = props.request?.request_id
  saving.value = true
  try {
    await withSpinner(() => requestId ? PagoProveedorService.updateManualYuan(requestId, body) : PagoProveedorService.createManualYuan(body), 'Guardando solicitud…')
    showSuccess('Solicitud', requestId ? 'Quedó actualizada.' : 'Quedó en Pendiente. No se avisa a Ventas ni al cliente.')
    emit('saved')
  } catch (error: any) {
    showError('Solicitud', error?.data?.message || 'No se pudo guardar la solicitud.')
  } finally {
    saving.value = false
  }
}
</script>
