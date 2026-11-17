<template>
  <UModal
    :open="open"
    :title="client ? 'Editar cliente' : 'Nuevo cliente'"
    :dismissible="!saving"
    :ui="{ content: 'w-full max-w-2xl sm:max-w-2xl', header: 'border-t-[5px] border-t-primary-500', title: 'text-lg font-bold text-highlighted' }"
    @update:open="(value: boolean) => !value && emit('close')"
  >
    <template #body>
      <!-- PRY-26-0003: cada cliente es una organización (socio o importador). -->
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
              @click="form.type = option.value"
            >
              {{ option.label }}
            </UButton>
          </div>
        </div>

        <UFormField label="Nombre o empresa" required help="Es el nombre de su organización.">
          <UInput v-model="form.name" placeholder="ej. Importaciones Sur SAC" class="w-full" />
        </UFormField>
        <UFormField label="País de origen" required>
          <USelectMenu
            v-model="form.origin_country_id"
            :items="countryItems"
            value-key="value"
            placeholder="Selecciona el país"
            :search-input="{ placeholder: 'Buscar país...' }"
            class="w-full"
          />
        </UFormField>

        <UFormField v-if="isPartner" label="Países para consolidar" class="sm:col-span-2" help="Por defecto, su país de origen.">
          <USelectMenu
            v-model="form.consolidation_country_ids"
            :items="countryItems"
            value-key="value"
            multiple
            placeholder="Selecciona los países"
            :search-input="{ placeholder: 'Buscar país...' }"
            class="w-full"
          />
        </UFormField>

        <UFormField label="WhatsApp" required>
          <UInput v-model="form.whatsapp" type="tel" placeholder="+51 999 999 999" class="w-full" />
        </UFormField>
        <UFormField label="Contacto" hint="(opcional)">
          <UInput v-model="form.contact_name" placeholder="Nombre de la persona" class="w-full" />
        </UFormField>
        <UFormField
          label="Correo"
          hint="(opcional)"
          class="sm:col-span-2"
          help="Si lo ingresas, se crea su usuario de la plataforma: usuario y contraseña serán este correo."
        >
          <UInput v-model="form.email" type="email" placeholder="correo@empresa.com" class="w-full" />
        </UFormField>

        <div v-if="isPartner" class="rounded-xl border border-default p-4 sm:col-span-2">
          <p class="font-semibold text-highlighted">Tarifas del socio (USD / CBM)</p>
          <p class="mb-3 text-xs text-muted">Se ofrecen al crear una operación para este socio y se pueden modificar en cada una.</p>
          <div class="grid gap-3 sm:grid-cols-2">
            <UFormField label="Tarifa 1 · menos de 1 CBM" required>
              <UInputNumber :ui="{ increment: 'hidden', decrement: 'hidden', base: 'px-3 text-left' }" v-model="form.rate_1" :min="0" :step="1" placeholder="Ingresa la tarifa" class="w-full" />
            </UFormField>
            <UFormField label="Tarifa 2 · 1 CBM o más" required>
              <UInputNumber :ui="{ increment: 'hidden', decrement: 'hidden', base: 'px-3 text-left' }" v-model="form.rate_2" :min="0" :step="1" placeholder="Ingresa la tarifa" class="w-full" />
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
import { computed, nextTick, reactive, ref, watch } from 'vue'
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
  name: '',
  origin_country_id: undefined as number | undefined,
  consolidation_country_ids: [] as number[],
  whatsapp: '',
  contact_name: '',
  email: '',
  rate_1: null as number | null,
  rate_2: null as number | null
})

const form = reactive(blank())
const saving = ref(false)
const errorMessage = ref('')
const isPartner = computed(() => form.type === 'partner')
const countries = ref<ChinaCountryOption[]>([])
const countryItems = computed(() => countries.value.map((country) => ({ value: country.value, label: country.label })))
/** Mientras se carga el cliente no se toca su lista de países para consolidar. */
let loadingClient = false

// El país de origen es el país para consolidar por defecto del socio.
watch(() => form.origin_country_id, (value, previous) => {
  if (loadingClient || !value || !isPartner.value) return
  const list = form.consolidation_country_ids.filter((id) => id !== previous)
  form.consolidation_country_ids = list.includes(value) ? list : [value, ...list]
})
watch(() => form.type, (type) => {
  if (type === 'partner' && !form.consolidation_country_ids.length && form.origin_country_id) {
    form.consolidation_country_ids = [form.origin_country_id]
  }
})

watch(() => [props.open, props.client], async () => {
  if (!props.open) return
  errorMessage.value = ''
  loadingClient = true
  Object.assign(form, blank())
  if (!countries.value.length) {
    try {
      countries.value = (await ChinaBillingService.clientCountries()).data
    } catch {
      countries.value = []
    }
  }
  const client = props.client
  if (client) {
    Object.assign(form, {
      type: client.type,
      name: client.name,
      origin_country_id: client.origin_country_id ?? undefined,
      consolidation_country_ids: [...(client.consolidation_country_ids || [])],
      whatsapp: client.whatsapp,
      contact_name: client.contact_name,
      email: client.email,
      rate_1: client.rate_1 ?? client.prices?.consol ?? null,
      rate_2: client.rate_2 ?? client.prices?.consol_2 ?? null
    })
  }
  // Deja pasar los watchers del Object.assign antes de volver a reaccionar al país de origen.
  await nextTick()
  loadingClient = false
}, { immediate: true })

function fail(message: string) {
  errorMessage.value = message
}

async function save() {
  errorMessage.value = ''
  if (!form.name.trim()) return fail('Ingresa el nombre del cliente.')
  if (!form.origin_country_id) return fail('Elige el país de origen del cliente.')
  if (!form.whatsapp.trim()) return fail('Ingresa el WhatsApp del cliente.')
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return fail('El correo no es válido.')
  if (isPartner.value && (!(Number(form.rate_1) > 0) || !(Number(form.rate_2) > 0))) {
    return fail('Ingresa la tarifa 1 y la tarifa 2 del socio.')
  }
  saving.value = true
  try {
    const payload: ChinaClientPayload = {
      type: form.type,
      name: form.name.trim(),
      origin_country_id: form.origin_country_id ?? null,
      consolidation_country_ids: isPartner.value
        ? (form.consolidation_country_ids.length ? [...form.consolidation_country_ids] : [form.origin_country_id])
        : [],
      whatsapp: form.whatsapp.trim(),
      contact_name: form.contact_name.trim(),
      email: form.email.trim(),
      rate_1: isPartner.value ? form.rate_1 : null,
      rate_2: isPartner.value ? form.rate_2 : null
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
