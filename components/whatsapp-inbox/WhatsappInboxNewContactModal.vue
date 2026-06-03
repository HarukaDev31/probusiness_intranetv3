<template>
  <UModal
    v-model:open="open"
    title="Nuevo contacto"
    :ui="{ width: 'sm:max-w-md' }"
  >
    <template #body>
      <div class="space-y-4">
        <p class="text-xs text-muted">
          El contacto queda en tu lista. Para el primer mensaje debes usar una plantilla aprobada
          (ventana de 24 h cerrada hasta que el cliente responda).
        </p>

        <UFormField label="Nombre del contacto" required>
          <UInput
            v-model="contactName"
            placeholder="Ej. María López"
            autocomplete="name"
          />
        </UFormField>

        <UFormField
          label="Teléfono WhatsApp"
          :hint="phonePreview || '9 dígitos (Perú) o número con código 51'"
          required
        >
          <UInput
            v-model="phone"
            placeholder="987 654 321"
            inputmode="tel"
            autocomplete="tel"
          />
        </UFormField>

        <UFormField label="Asignar a (opcional)">
          <USelect
            v-model="assignedUserId"
            :items="assignItems"
            placeholder="Sin asignar"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <UButton color="neutral" variant="ghost" label="Cancelar" @click="close" />
      <UButton
        color="primary"
        label="Registrar contacto"
        :disabled="!canSubmit"
        :loading="saving"
        @click="emitSave"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { WaInboxAssignableUser } from '~/types/whatsapp-inbox'
import {
  formatWaInboxPhonePreview,
  isValidWaInboxPhone,
  normalizeWaInboxPhoneE164
} from '~/utils/whatsappInboxPhone'

const props = defineProps<{
  assignableUsers: WaInboxAssignableUser[]
  saving?: boolean
}>()

const emit = defineEmits<{
  save: [payload: { contact_name: string; phone: string; assigned_user_id: number | null }]
}>()

const open = defineModel<boolean>('open', { default: false })

const contactName = ref('')
const phone = ref('')
const assignedUserId = ref<number>(0)

const assignItems = computed(() => [
  { label: 'Sin asignar', value: 0 },
  ...props.assignableUsers.map((u) => ({ label: u.name, value: u.id }))
])

const phonePreview = computed(() => {
  const e164 = normalizeWaInboxPhoneE164(phone.value)
  return e164 ? formatWaInboxPhonePreview(e164) : ''
})

const canSubmit = computed(() => {
  const name = contactName.value.trim()
  return name.length >= 2 && isValidWaInboxPhone(phone.value)
})

function resetForm() {
  contactName.value = ''
  phone.value = ''
  assignedUserId.value = 0
}

function close() {
  open.value = false
}

function emitSave() {
  if (!canSubmit.value) return
  emit('save', {
    contact_name: contactName.value.trim(),
    phone: phone.value.trim(),
    assigned_user_id: assignedUserId.value > 0 ? assignedUserId.value : null
  })
}

watch(open, (isOpen) => {
  if (!isOpen) resetForm()
})
</script>
