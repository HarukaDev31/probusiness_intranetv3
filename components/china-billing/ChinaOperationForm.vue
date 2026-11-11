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
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Cliente" required class="sm:col-span-2">
          <USelectMenu
            v-model="form.organization_id"
            :items="organizationItems"
            value-key="value"
            placeholder="Selecciona un cliente"
            :disabled="isDraft || isEdit"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Tipo de cobro" required class="sm:col-span-2">
          <div class="flex gap-2">
            <UButton
              v-for="option in billingOptions"
              :key="option.value"
              size="sm"
              :color="form.billing_type === option.value ? 'primary' : 'neutral'"
              :variant="form.billing_type === option.value ? 'solid' : 'outline'"
              :disabled="isDraft"
              @click="form.billing_type = option.value"
            >
              {{ option.label }}
            </UButton>
          </div>
        </UFormField>

        <UFormField label="Servicio" required>
          <UInput v-model="form.service_name" placeholder="Ej. Consolidado, Inspección" class="w-full" />
        </UFormField>
        <UFormField label="Variante / modalidad">
          <UInput v-model="form.variant_name" placeholder="Ej. Física, Virtual" class="w-full" />
        </UFormField>

        <UFormField label="Fecha" required>
          <UInput v-model="form.issued_on" type="date" class="w-full" />
        </UFormField>
        <UFormField label="Descripción" required>
          <UInput v-model="form.description" placeholder="Consolidado, contenedor o detalle" class="w-full" />
        </UFormField>

        <template v-if="form.billing_type === CHINA_BILLING_TYPE.CBM">
          <UFormField label="CBM" required :hint="isDraft ? 'CBM China del consolidado cerrado' : undefined">
            <UInputNumber v-model="form.cbm" :min="0" :step="0.01" class="w-full" />
          </UFormField>
          <UFormField label="Tarifa por CBM (USD)" required>
            <UInputNumber v-model="form.rate" :min="0" :step="1" class="w-full" />
          </UFormField>
          <div v-if="clientRates.length" class="flex flex-wrap items-center gap-2 text-sm sm:col-span-2">
            <span class="text-muted">Tarifas del cliente:</span>
            <UButton
              v-for="rate in clientRates"
              :key="rate.label"
              size="xs"
              :color="form.rate === rate.value ? 'primary' : 'neutral'"
              :variant="form.rate === rate.value ? 'soft' : 'outline'"
              @click="form.rate = rate.value"
            >
              {{ rate.label }} · {{ usd(rate.value) }}
            </UButton>
          </div>
        </template>
        <UFormField v-else label="Monto del servicio (USD)" required class="sm:col-span-2">
          <UInputNumber v-model="form.amount" :min="0" :step="1" class="w-full" />
        </UFormField>

        <UFormField label="FOB (USD)">
          <UInputNumber v-model="form.fob" :min="0" :step="1" class="w-full" />
        </UFormField>
        <UFormField label="Flete (USD)">
          <UInputNumber v-model="form.freight" :min="0" :step="1" class="w-full" />
        </UFormField>

        <div class="sm:col-span-2">
          <div class="mb-2 flex items-center justify-between">
            <p class="text-sm font-medium text-highlighted">Costos adicionales</p>
            <UButton size="xs" color="neutral" variant="soft" icon="i-heroicons-plus" @click="addCost">Agregar costo</UButton>
          </div>
          <p v-if="!form.costs.length" class="text-sm text-muted">Sin costos adicionales.</p>
          <div v-for="(cost, index) in form.costs" :key="index" class="mb-2 grid grid-cols-[1fr_9rem_auto] gap-2">
            <UInput v-model="cost.name" placeholder="Nombre del costo" />
            <UInputNumber v-model="cost.amount" :min="0" :step="1" />
            <UButton color="error" variant="ghost" icon="i-heroicons-trash" aria-label="Quitar costo" @click="form.costs.splice(index, 1)" />
          </div>
        </div>

        <div class="sm:col-span-2">
          <p class="mb-1 text-sm font-medium text-highlighted">Packing list (Excel)</p>
          <YuanFilePick label="Adjuntar packing list" accept=".xls,.xlsx" :current-name="operation?.packing_list_url ? 'Packing list cargado' : ''" @pick="packing = $event" />
        </div>

        <UCard variant="subtle" class="sm:col-span-2">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">Total de la operación</span>
            <span class="text-xl font-bold text-highlighted">{{ usd(total) }}</span>
          </div>
        </UCard>

        <UAlert
          v-if="errorMessage"
          class="sm:col-span-2"
          color="error"
          variant="subtle"
          icon="i-heroicons-exclamation-triangle"
          :description="errorMessage"
        />
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="outline" :disabled="saving" @click="emit('close')">Cancelar</UButton>
        <UButton color="primary" :loading="saving" @click="save">{{ saveLabel }}</UButton>
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
  service_name: '',
  billing_type: CHINA_BILLING_TYPE.FIXED as string,
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
const organizationItems = computed(() => props.organizations.map((org) => ({ value: org.id, label: `${org.name}${org.country ? ` · ${org.country}` : ''}` })))

watch(() => [props.open, props.operation, props.draft], () => {
  if (!props.open) return
  errorMessage.value = ''
  packing.value = null
  Object.assign(form, blank())
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
