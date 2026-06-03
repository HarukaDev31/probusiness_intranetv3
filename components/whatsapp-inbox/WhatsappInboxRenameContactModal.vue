<template>
  <UModal
    v-model:open="open"
    title="Renombrar contacto"
    :ui="{ width: 'sm:max-w-md' }"
  >
    <template #body>
      <div class="space-y-4">
        <p class="text-xs text-muted">
          Solo cambia el nombre en tu lista. El número de WhatsApp no se modifica.
        </p>
        <UFormField label="Nombre del contacto" required>
          <UInput
            v-model="name"
            placeholder="Ej. María López"
            autocomplete="name"
            maxlength="120"
            @keydown.enter.prevent="onSave"
          />
        </UFormField>
        <p v-if="phoneDisplay" class="text-xs text-muted">
          Teléfono: {{ phoneDisplay }}
        </p>
      </div>
    </template>
    <template #footer>
      <UButton color="neutral" variant="ghost" label="Cancelar" @click="close" />
      <UButton
        color="primary"
        label="Guardar"
        :disabled="!canSubmit"
        :loading="saving"
        @click="onSave"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  initialName?: string
  phoneDisplay?: string
  saving?: boolean
}>()

const emit = defineEmits<{
  save: [name: string]
}>()

const open = defineModel<boolean>('open', { default: false })

const name = ref('')

const canSubmit = computed(() => name.value.trim().length > 0 && !props.saving)

watch(open, (isOpen) => {
  if (isOpen) {
    name.value = (props.initialName || '').trim()
  }
})

watch(
  () => props.initialName,
  (v) => {
    if (open.value) name.value = (v || '').trim()
  }
)

function close() {
  open.value = false
}

async function onSave() {
  const trimmed = name.value.trim()
  if (!trimmed || props.saving) return
  emit('save', trimmed)
}
</script>
