<template>
  <UModal
    :open="open"
    title="Datos bancarios de China"
    description="Aparecen en las facturas, en los balances de pago y al socio cuando va a pagar."
    :dismissible="!saving"
    :ui="{ content: 'w-full max-w-xl sm:max-w-xl', header: 'border-t-[5px] border-t-primary-500', title: 'text-lg font-bold text-highlighted' }"
    @update:open="(value: boolean) => !value && emit('close')"
  >
    <template #body>
      <USkeleton v-if="loading" class="h-40 w-full" />
      <div v-else class="grid gap-4">
        <UFormField label="Empresa" required><UInput v-model="form.company" class="w-full" /></UFormField>
        <UFormField label="Beneficiario"><UInput v-model="form.beneficiary" class="w-full" /></UFormField>
        <UFormField label="Banco intermediario"><UInput v-model="form.intermediary_bank" class="w-full" /></UFormField>
        <UFormField label="Banco pagador"><UInput v-model="form.payer_bank" class="w-full" /></UFormField>
        <UFormField label="Número de cuenta"><UInput v-model="form.account_number" class="w-full" /></UFormField>
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

const form = reactive<ChinaBankAccount>({ company: '', beneficiary: '', intermediary_bank: '', payer_bank: '', account_number: '' })
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
