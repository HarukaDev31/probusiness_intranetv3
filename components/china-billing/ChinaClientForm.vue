<template>
  <UModal
    :open="open"
    :title="client ? 'Editar cliente' : 'Nuevo cliente'"
    :dismissible="!saving"
    :ui="{ content: 'w-full max-w-2xl sm:max-w-2xl', header: 'border-t-[5px] border-t-primary-500', title: 'text-lg font-bold text-highlighted' }"
    @update:open="(value: boolean) => !value && emit('close')"
  >
    <template #body>
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <p class="mb-1.5 text-sm font-medium text-highlighted">Tipo de cliente</p>
          <div class="flex gap-2">
            <UButton
              v-for="option in typeOptions"
              :key="option.value"
              size="sm"
              :color="form.type === option.value ? 'primary' : 'neutral'"
              :variant="form.type === option.value ? 'soft' : 'outline'"
              :disabled="!!client"
              @click="form.type = option.value"
            >
              {{ option.label }}
            </UButton>
          </div>
        </div>

        <UFormField label="Nombre o empresa" required :hint="isPartner && !client ? 'Se crea como organización del socio' : undefined">
          <UInput v-model="form.name" :disabled="isPartner && !!client" placeholder="ej. Importaciones Sur SAC" class="w-full" />
        </UFormField>
        <UFormField v-if="isPartner && !client" label="País" required>
          <USelectMenu v-model="form.country_id" :items="countryItems" value-key="value" placeholder="Selecciona el país" class="w-full" />
        </UFormField>
        <UFormField v-else label="País">
          <UInput v-model="form.country" :disabled="isPartner" placeholder="ej. Perú" class="w-full" />
        </UFormField>

        <UFormField label="WhatsApp" required>
          <UInput v-model="form.whatsapp" type="tel" placeholder="+51 999 999 999" class="w-full" />
        </UFormField>
        <UFormField label="Contacto" hint="(opcional)">
          <UInput v-model="form.contact_name" placeholder="Nombre de la persona" class="w-full" />
        </UFormField>
        <UFormField label="Correo" hint="(opcional)" class="sm:col-span-2">
          <UInput v-model="form.email" type="email" placeholder="correo@empresa.com" class="w-full" />
        </UFormField>

        <div v-if="isPartner" class="rounded-xl border border-default p-4 sm:col-span-2">
          <p class="font-semibold text-highlighted">Precios del socio</p>
          <p class="mb-3 text-xs text-muted">Se cargan solos al crear una operación para este socio y se pueden modificar en cada una.</p>
          <div class="grid gap-3 sm:grid-cols-2">
            <UFormField label="Consolidado · tarifa 1 (USD/CBM)" required>
              <UInputNumber v-model="form.prices.consol" :min="0" :step="1" placeholder="Ingresa la tarifa" class="w-full" />
            </UFormField>
            <UFormField label="Consolidado · tarifa 2 (USD/CBM)" required>
              <UInputNumber v-model="form.prices.consol_2" :min="0" :step="1" placeholder="Ingresa la tarifa" class="w-full" />
            </UFormField>
          </div>
        </div>

        <UAlert v-if="errorMessage" class="sm:col-span-2" color="error" variant="subtle" icon="i-heroicons-exclamation-triangle" :description="errorMessage" />
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="outline" :disabled="saving" @click="emit('close')">Cancelar</UButton>
        <UButton color="primary" :loading="saving" @click="save">{{ client ? 'Guardar cambios' : 'Crear cliente' }}</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ChinaBillingService } from '~/services/chinaBillingService'
import type { ChinaClient, ChinaClientPayload, ChinaClientType, ChinaCountryOption } from '~/types/china-billing'

const props = defineProps<{ open: boolean; client?: ChinaClient | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const typeOptions: { value: ChinaClientType; label: string }[] = [
  { value: 'partner', label: 'Socio' },
  { value: 'importer', label: 'Importador' }
]

const blank = () => ({
  type: 'partner' as ChinaClientType,
  country_id: null as number | null,
  name: '',
  country: '',
  whatsapp: '',
  contact_name: '',
  email: '',
  prices: { consol: null as number | null, consol_2: null as number | null }
})

const form = reactive(blank())
const saving = ref(false)
const errorMessage = ref('')
const isPartner = computed(() => form.type === 'partner')
const countries = ref<ChinaCountryOption[]>([])
const countryItems = computed(() => countries.value.map((country) => ({ value: country.value, label: country.label })))

watch(() => [props.open, props.client], async () => {
  if (!props.open) return
  errorMessage.value = ''
  Object.assign(form, blank())
  if (!countries.value.length) {
    try {
      countries.value = (await ChinaBillingService.clientCountries()).data
    } catch {
      countries.value = []
    }
  }
  const client = props.client
  if (!client) return
  Object.assign(form, {
    type: client.type,
    name: client.name,
    country: client.country,
    whatsapp: client.whatsapp,
    contact_name: client.contact_name,
    email: client.email,
    prices: { consol: client.prices?.consol ?? null, consol_2: client.prices?.consol_2 ?? null }
  })
}, { immediate: true })

function fail(message: string) {
  errorMessage.value = message
}

async function save() {
  errorMessage.value = ''
  if (!form.name.trim()) return fail('Ingresa el nombre del cliente.')
  if (isPartner.value && !props.client && !form.country_id) return fail('Elige el país de la organización.')
  if (!form.whatsapp.trim()) return fail('Ingresa el WhatsApp del cliente.')
  if (isPartner.value && (!(form.prices.consol && form.prices.consol > 0) || !(form.prices.consol_2 && form.prices.consol_2 > 0))) {
    return fail('Ingresa las dos tarifas de consolidado del socio.')
  }
  saving.value = true
  try {
    const payload: ChinaClientPayload = {
      type: form.type,
      organization_id: props.client?.organization_id ?? null,
      country_id: isPartner.value && !props.client ? form.country_id : null,
      name: form.name.trim(),
      country: form.country.trim(),
      whatsapp: form.whatsapp.trim(),
      contact_name: form.contact_name.trim(),
      email: form.email.trim(),
      prices: isPartner.value ? { consol: form.prices.consol, consol_2: form.prices.consol_2 } : null
    }
    if (props.client) await ChinaBillingService.updateClient(props.client.id, payload)
    else await ChinaBillingService.createClient(payload)
    emit('saved')
  } catch (error: any) {
    errorMessage.value = error?.message || 'No se pudo guardar el cliente.'
  } finally {
    saving.value = false
  }
}
</script>
