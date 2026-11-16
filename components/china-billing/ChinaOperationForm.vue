<template>
  <UModal
    :open="open"
    :title="title"
    :description="subtitle"
    :dismissible="!saving"
    :ui="{ content: 'w-full max-w-2xl sm:max-w-2xl', header: 'border-t-[5px] border-t-primary-500', title: 'text-lg font-bold text-highlighted' }"
    @update:open="(value: boolean) => !value && emit('close')"
  >
    <template #body>
      <!-- #1957: plantilla de la maqueta (País · Cliente · Tipo de servicio, CBM × tarifa, FOB y flete, monto total abajo). -->
      <div class="flex flex-col gap-5">
        <div class="grid gap-3 sm:grid-cols-3">
          <UFormField label="País">
            <USelect v-model="country" :items="countryItems" placeholder="País" :disabled="isDraft || isEdit" class="w-full" />
          </UFormField>
          <UFormField label="Cliente" required>
            <USelectMenu
              v-model="form.organization_id"
              :items="organizationItems"
              value-key="value"
              placeholder="Selecciona un cliente"
              :disabled="isDraft || isEdit"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Tipo de servicio" required>
            <USelect v-model="serviceKind" :items="serviceItems" :disabled="isDraft" class="w-full" />
          </UFormField>
          <UFormField v-if="serviceKind === OTHER" label="Nombre del servicio" required class="sm:col-span-3">
            <UInput v-model="form.service_name" placeholder="Ej. Etiquetado, Almacenaje" class="w-full" />
          </UFormField>
        </div>

        <USeparator />

        <div class="grid gap-3 sm:grid-cols-[2fr_1fr]">
          <UFormField label="Descripción" required>
            <UInput v-model="form.description" placeholder="Escribe o elige un consolidado del cliente" class="w-full" />
          </UFormField>
          <UFormField label="Fecha">
            <UInput v-model="form.issued_on" type="date" class="w-full" />
          </UFormField>
        </div>

        <div v-if="form.billing_type === CHINA_BILLING_TYPE.CBM" class="flex flex-col gap-2">
          <div class="grid gap-3 sm:grid-cols-3">
            <UFormField label="CBM" required :hint="isDraft ? 'CBM China del consolidado' : undefined">
              <UInputNumber v-model="form.cbm" :min="0" :step="0.01" placeholder="0.00" class="w-full" />
            </UFormField>
            <UFormField label="Tarifa (USD / CBM)" required>
              <UInputNumber v-model="form.rate" :min="0" :step="1" class="w-full" />
            </UFormField>
            <UFormField label="Monto servicio">
              <div class="flex h-9 items-center rounded-md bg-primary/10 px-3 font-semibold text-highlighted">{{ usd(serviceAmount) }}</div>
            </UFormField>
          </div>
          <div v-if="clientRates.length" class="flex flex-wrap items-center gap-2 text-sm">
            <span class="text-muted">Tarifas del cliente:</span>
            <UButton
              v-for="rate in clientRates"
              :key="rate.label"
              size="xs"
              :color="form.rate === rate.value ? 'primary' : 'neutral'"
              :variant="form.rate === rate.value ? 'soft' : 'outline'"
              :class="form.rate === rate.value ? 'ring ring-primary/60' : ''"
              @click="form.rate = rate.value"
            >
              {{ rate.label }} · {{ usd(rate.value) }}
            </UButton>
          </div>
          <p v-if="clientRates.length && selectedOrganization" class="flex items-center gap-1 text-xs text-success">
            <UIcon name="i-heroicons-check" class="size-3.5" />
            Precio del socio {{ selectedOrganization.name }}: {{ usd(clientRates[0].value) }} por CBM · puedes modificarlo
          </p>
        </div>
        <UFormField v-else label="Monto servicio (USD)" required>
          <UInputNumber v-model="form.amount" :min="0" :step="1" class="w-full" />
        </UFormField>

        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField label="Costo FOB (USD)" required>
            <UInputNumber v-model="form.fob" :min="0" :step="1" placeholder="0.00" class="w-full" />
          </UFormField>
          <UFormField label="Flete (USD)" required>
            <UInputNumber v-model="form.freight" :min="0" :step="1" placeholder="0.00" class="w-full" />
          </UFormField>
        </div>

        <div>
          <div v-for="(cost, index) in form.costs" :key="index" class="mb-2 grid grid-cols-[1fr_9rem_auto] gap-2">
            <UInput v-model="cost.name" placeholder="Nombre del costo" />
            <UInputNumber v-model="cost.amount" :min="0" :step="1" />
            <UButton color="error" variant="ghost" icon="i-heroicons-trash" aria-label="Quitar costo" @click="form.costs.splice(index, 1)" />
          </div>
          <UButton size="sm" color="primary" variant="link" class="px-0" icon="i-heroicons-plus" @click="addCost">Agregar costo</UButton>
        </div>

        <div>
          <p class="mb-1 text-sm font-medium text-highlighted">Packing list (Excel)</p>
          <YuanFilePick label="Adjuntar packing list" accept=".xls,.xlsx" :current-name="operation?.packing_list_url ? 'Packing list cargado' : ''" @pick="packing = $event" />
        </div>

        <UAlert
          v-if="errorMessage"
          color="error"
          variant="subtle"
          icon="i-heroicons-exclamation-triangle"
          :description="errorMessage"
        />
      </div>
    </template>
    <template #footer>
      <div class="flex w-full flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-xs uppercase tracking-wider text-muted">Monto total</p>
          <p class="text-2xl font-bold text-highlighted">{{ usd(total) }}</p>
          <p v-if="missing.length" class="text-xs text-error">Falta: {{ missing.join(', ') }}</p>
        </div>
        <div class="flex gap-2">
          <UButton color="neutral" variant="outline" :disabled="saving" @click="emit('close')">Cancelar</UButton>
          <UButton color="primary" :loading="saving" :disabled="missing.length > 0" @click="save">{{ saveLabel }}</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import YuanFilePick from '~/components/pago-proveedor/YuanFilePick.vue'
import { CHINA_BILLING_TYPE } from '~/constants/chinaBilling'
import { ChinaBillingService } from '~/services/chinaBillingService'
import type { ChinaOperation, ChinaOrganizationOption } from '~/types/china-billing'

const props = defineProps<{
  open: boolean
  organizations: ChinaOrganizationOption[]
  /** Operación a editar. */
  operation?: ChinaOperation | null
  /** Borrador "Por aprobar" que se está aprobando. */
  draft?: ChinaOperation | null
}>()

const emit = defineEmits<{ close: []; saved: [] }>()

const saving = ref(false)
const errorMessage = ref('')
const packing = ref<File | null>(null)

const billingOptions = [
  { value: CHINA_BILLING_TYPE.CBM, label: 'Por CBM' },
  { value: CHINA_BILLING_TYPE.FIXED, label: 'Monto fijo' }
]

const blank = () => ({
  organization_id: null as number | null,
  container_id: null as number | null,
  service_name: 'Consolidado',
  billing_type: CHINA_BILLING_TYPE.CBM as string,
  variant_name: '',
  issued_on: new Date().toISOString().slice(0, 10),
  description: '',
  cbm: null as number | null,
  rate: null as number | null,
  amount: null as number | null,
  fob: null as number | null,
  freight: null as number | null,
  costs: [] as { name: string; amount: number }[]
})

const form = reactive(blank())

// #1957: el tipo de servicio define el cobro (Consolidado = por CBM; el resto, monto fijo).
const OTHER = '__otro__'
const SERVICE_TYPES = [
  { value: 'Consolidado', label: 'Consolidado', billing: CHINA_BILLING_TYPE.CBM },
  { value: 'Inspección', label: 'Inspección', billing: CHINA_BILLING_TYPE.FIXED },
  { value: OTHER, label: 'Otro servicio', billing: CHINA_BILLING_TYPE.FIXED }
]
const serviceItems = SERVICE_TYPES.map(({ value, label }) => ({ value, label }))
const serviceKind = computed({
  get: () => SERVICE_TYPES.find((type) => type.value !== OTHER && type.value === form.service_name)?.value ?? (form.service_name || form.billing_type === CHINA_BILLING_TYPE.FIXED ? OTHER : 'Consolidado'),
  set: (value: string) => {
    const type = SERVICE_TYPES.find((item) => item.value === value)!
    form.service_name = value === OTHER ? '' : value
    form.billing_type = type.billing
  }
})
const country = ref<string | undefined>(undefined)
const countryItems = computed(() => [...new Set(props.organizations.map((org) => org.country).filter(Boolean))].map((name) => ({ value: name, label: name })))
const selectedOrganization = computed(() => props.organizations.find((org) => org.id === form.organization_id) || null)
const serviceAmount = computed(() => Math.round(Number(form.cbm || 0) * Number(form.rate || 0) * 100) / 100)
const missing = computed(() => {
  const list: string[] = []
  if (!form.organization_id) list.push('cliente')
  if (!form.service_name.trim()) list.push('servicio')
  if (!form.description.trim()) list.push('descripción')
  if (form.billing_type === CHINA_BILLING_TYPE.CBM) {
    if (!(Number(form.cbm) > 0)) list.push('CBM')
    if (!(Number(form.rate) > 0)) list.push('tarifa')
  } else if (!(Number(form.amount) > 0)) list.push('monto servicio')
  if (form.fob === null || form.fob === undefined) list.push('costo FOB')
  if (form.freight === null || form.freight === undefined) list.push('flete')
  return list
})
watch(country, (value) => {
  if (isEdit.value || isDraft.value) return
  if (value && selectedOrganization.value && selectedOrganization.value.country !== value) form.organization_id = null
})
watch(() => form.organization_id, () => {
  if (selectedOrganization.value?.country) country.value = selectedOrganization.value.country
})

/** Solo para mostrar: el backend recalcula con la misma fórmula al guardar. */
const total = computed(() => chinaOperationTotal(form))
const isDraft = computed(() => !!props.draft)
const isEdit = computed(() => !!props.operation)
const title = computed(() => {
  if (props.draft) return `Aprobar operación · ${props.draft.organization.name}`
  return props.operation ? `Editar operación · ${props.operation.code}` : 'Nueva operación'
})
const subtitle = computed(() => {
  if (props.draft) return 'Generada al cerrar el consolidado. Completa FOB y flete, revisa CBM y tarifa; al aprobar se crea el N° de orden.'
  return props.operation ? 'Los pagos aplicados a esta orden se mantienen.' : 'El número de orden se genera al guardar.'
})
/** Tarifas por CBM que se registraron para el socio en Clientes. */
const clientRates = computed(() => {
  const prices = props.organizations.find((org) => org.id === form.organization_id)?.prices
  return [
    { label: 'Tarifa 1', value: Number(prices?.consol || 0) },
    { label: 'Tarifa 2', value: Number(prices?.consol_2 || 0) }
  ].filter((rate) => rate.value > 0)
})

// Al crear una operación por CBM se precarga la tarifa 1 del cliente (se puede cambiar).
watch(() => [form.organization_id, form.billing_type], () => {
  if (isEdit.value || isDraft.value || form.billing_type !== CHINA_BILLING_TYPE.CBM || form.rate) return
  if (clientRates.value.length) form.rate = clientRates.value[0].value
})

const saveLabel = computed(() => (props.draft ? 'Aprobar operación' : props.operation ? 'Guardar cambios' : 'Guardar'))
const organizationItems = computed(() => props.organizations
  .filter((org) => !country.value || org.country === country.value)
  .map((org) => ({ value: org.id, label: org.name })))

watch(() => [props.open, props.operation, props.draft], () => {
  if (!props.open) return
  errorMessage.value = ''
  packing.value = null
  Object.assign(form, blank())
  country.value = undefined
  const source = props.draft || props.operation
  if (!source) return
  Object.assign(form, {
    organization_id: source.organization.id,
    container_id: props.draft ? props.draft.container_id : null,
    service_name: source.service_name,
    billing_type: source.billing_type,
    variant_name: source.variant_name || '',
    issued_on: source.issued_on,
    description: source.description,
    cbm: source.cbm,
    rate: source.rate ?? null,
    amount: source.amount || null,
    fob: source.fob || null,
    freight: source.freight || null,
    costs: (source.costs || []).filter((cost) => !cost.source_operation_id).map((cost) => ({ name: cost.name, amount: cost.amount }))
  })
}, { immediate: true })

function addCost() {
  form.costs.push({ name: '', amount: 0 })
}

async function save() {
  errorMessage.value = ''
  if (!form.organization_id || !form.service_name.trim() || !form.description.trim()) {
    errorMessage.value = 'Completa cliente, servicio y descripción.'
    return
  }
  saving.value = true
  try {
    const payload = { ...form, organization_id: form.organization_id, packing_list: packing.value }
    if (props.operation?.id) await ChinaBillingService.updateOperation(props.operation.id, payload)
    else await ChinaBillingService.createOperation(payload)
    emit('saved')
  } catch (error: any) {
    errorMessage.value = error?.message || 'No se pudo guardar la operación.'
  } finally {
    saving.value = false
  }
}
</script>
