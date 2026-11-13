<template>
  <UModal
    :open="open"
    title="Datos bancarios de China"
    description="Aparecen en las facturas, en los balances de pago y al socio cuando va a pagar."
    :dismissible="!saving"
    :ui="{ content: 'w-full max-w-2xl sm:max-w-2xl', header: 'border-t-[5px] border-t-primary-500', title: 'text-lg font-bold text-highlighted' }"
    @update:open="(value: boolean) => !value && emit('close')"
  >
    <template #body>
      <USkeleton v-if="loading" class="h-40 w-full" />
      <div v-else class="grid gap-5">
        <div class="grid gap-3">
          <UFormField label="Empresa" required><UInput v-model="form.company" class="w-full" /></UFormField>
          <UFormField label="Dirección de la oficina en China"><UInput v-model="form.company_address" class="w-full" /></UFormField>
        </div>
        <fieldset v-for="section in sections" :key="section.title" class="grid gap-3 rounded-xl border border-default p-4">
          <legend class="px-1 text-xs font-semibold uppercase tracking-wider text-muted">{{ section.title }}</legend>
          <div class="grid gap-3 sm:grid-cols-2">
            <UFormField v-for="field in section.fields" :key="field.key" :label="field.label" :class="field.wide ? 'sm:col-span-2' : ''">
              <UInput v-model="form[field.key]" class="w-full" />
            </UFormField>
          </div>
        </fieldset>
        <UAlert v-if="errorMessage" color="error" variant="subtle" icon="i-heroicons-exclamation-triangle" :description="errorMessage" />
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="outline" :disabled="saving" @click="emit('close')">Cancelar</UButton>
        <UButton color="primary" :loading="saving" @click="save">Guardar</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ChinaBillingService } from '~/services/chinaBillingService'
import type { ChinaBankAccount } from '~/types/china-billing'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const form = reactive<ChinaBankAccount>({
  company: '', company_address: '', beneficiary: '', beneficiary_address: '', beneficiary_country: '', beneficiary_state: '', beneficiary_city: '',
  account_number: '', intermediary_bank: '', intermediary_swift: '', intermediary_country: '', intermediary_state: '', intermediary_city: '',
  payer_bank: '', payer_swift: '', payer_country: '', payer_state: '', payer_city: ''
})

type Field = { key: keyof ChinaBankAccount; label: string; wide?: boolean }
const sections: { title: string; fields: Field[] }[] = [
  { title: 'Banco intermediario', fields: [
    { key: 'intermediary_swift', label: 'Código Swift' }, { key: 'intermediary_bank', label: 'Nombre del banco' },
    { key: 'intermediary_country', label: 'País' }, { key: 'intermediary_state', label: 'Estado' }, { key: 'intermediary_city', label: 'Ciudad' }
  ] },
  { title: 'Banco pagador', fields: [
    { key: 'payer_swift', label: 'Código Swift' }, { key: 'payer_bank', label: 'Nombre del banco' },
    { key: 'payer_country', label: 'País' }, { key: 'payer_state', label: 'Estado' }, { key: 'payer_city', label: 'Ciudad' }
  ] },
  { title: 'Beneficiario', fields: [
    { key: 'account_number', label: 'Cuenta' }, { key: 'beneficiary', label: 'Beneficiario' },
    { key: 'beneficiary_address', label: 'Dirección', wide: true },
    { key: 'beneficiary_country', label: 'País' }, { key: 'beneficiary_state', label: 'Estado' }, { key: 'beneficiary_city', label: 'Ciudad' }
  ] }
]
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')

watch(() => props.open, async (open) => {
  if (!open) return
  errorMessage.value = ''
  loading.value = true
  try {
    Object.assign(form, (await ChinaBillingService.bankAccount()).data)
  } catch (error: any) {
    errorMessage.value = error?.message || 'No se pudieron cargar los datos bancarios.'
  } finally {
    loading.value = false
  }
})

async function save() {
  errorMessage.value = ''
  if (!form.company.trim()) {
    errorMessage.value = 'Indica la empresa.'
    return
  }
  saving.value = true
  try {
    await ChinaBillingService.updateBankAccount({ ...form })
    emit('saved')
  } catch (error: any) {
    errorMessage.value = error?.message || 'No se pudo guardar.'
  } finally {
    saving.value = false
  }
}
</script>
