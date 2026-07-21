<template>
  <UModal v-model:open="isOpen" class="sm:max-w-lg" @update:open="onOpenChange">
    <template #header>
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Enviar WhatsApp — Cobranza
        </h3>
        <p class="text-sm text-gray-500 mt-1">
          Cotización #{{ idCotizacion }}. Elige qué plantillas enviar (todas marcadas por defecto).
        </p>
      </div>
    </template>

    <template #body>
      <div class="space-y-3">
        <label
          v-for="tpl in templates"
          :key="tpl.key"
          class="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          <UCheckbox
            :model-value="selected.includes(tpl.key)"
            @update:model-value="(v: boolean | 'indeterminate') => toggle(tpl.key, v === true)"
          />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ tpl.label }}</p>
            <p class="text-xs text-gray-500 mt-0.5">{{ tpl.description }}</p>
            <UBadge v-if="tpl.has_media" color="primary" variant="soft" size="sm" class="mt-1">
              Con adjunto
            </UBadge>
          </div>
        </label>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="outline" label="Solo guardar estado" :disabled="loading" @click="skip" />
        <UButton color="primary" label="Enviar seleccionadas" :loading="loading" @click="confirm" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

export type CobranzaWhatsappTemplate = {
  key: string
  label: string
  description: string
  selected_by_default: boolean
  has_media: boolean
}

const props = defineProps<{
  open: boolean
  idCotizacion: number | null
  templates: CobranzaWhatsappTemplate[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [templates: string[]]
  skip: []
}>()

const selected = ref<string[]>([])

const isOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v),
})

watch(
  () => [props.open, props.templates] as const,
  ([open]) => {
    if (open) {
      selected.value = props.templates
        .filter((t) => t.selected_by_default)
        .map((t) => t.key)
    }
  },
  { immediate: true, deep: true }
)

const toggle = (key: string, on: boolean) => {
  if (on) {
    if (!selected.value.includes(key)) selected.value = [...selected.value, key]
  } else {
    selected.value = selected.value.filter((k) => k !== key)
  }
}

const onOpenChange = (v: boolean) => {
  emit('update:open', v)
}

const confirm = () => {
  emit('confirm', [...selected.value])
}

const skip = () => {
  emit('skip')
}
</script>
