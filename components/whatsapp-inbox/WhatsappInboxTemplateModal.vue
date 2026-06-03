<template>
  <UModal v-model:open="open" title="Enviar plantilla" :ui="{ width: 'sm:max-w-lg' }">
    <template #body>
      <div class="max-h-[60vh] space-y-3 overflow-y-auto">
        <p v-if="!templates.length" class="py-6 text-center text-sm text-muted">
          No hay plantillas cargadas. Intenta actualizar el inbox.
        </p>
        <button
          v-for="tpl in templates"
          :key="tpl.name"
          type="button"
          class="w-full text-left"
          @click="selectTemplate(tpl)"
        >
          <UCard
            class="transition-colors"
            :variant="selected?.name === tpl.name ? 'subtle' : 'outline'"
            :color="selected?.name === tpl.name ? 'primary' : 'neutral'"
            :ui="{ body: 'p-3 sm:p-3' }"
          >
            <p class="text-sm font-semibold text-primary">{{ tpl.label || tpl.name }}</p>
            <p class="mt-1 line-clamp-2 text-xs text-muted">{{ tpl.text }}</p>
          </UCard>
        </button>

        <UCard v-if="selected" variant="subtle" :ui="{ body: 'space-y-2 p-3 sm:p-3' }">
          <p class="text-xs font-semibold uppercase text-muted">Parámetros</p>
          <UFormField
            v-for="p in selected.params"
            :key="p"
            :label="`{{${p}}}`"
          >
            <UInput
              :model-value="paramValues[p] ?? ''"
              :placeholder="`Valor para ${p}`"
              @update:model-value="(v) => updateParam(p, String(v ?? ''))"
            />
          </UFormField>
          <UCard v-if="previewText" variant="outline" color="info" :ui="{ body: 'p-3 text-xs sm:p-3' }">
            <p class="mb-1 font-semibold text-info">Vista previa</p>
            <p class="whitespace-pre-wrap text-muted">{{ previewText }}</p>
          </UCard>
        </UCard>
      </div>
    </template>
    <template #footer>
      <UButton color="neutral" variant="ghost" label="Cancelar" @click="open = false" />
      <UButton
        color="primary"
        label="Enviar plantilla"
        :disabled="!canSend"
        @click="emitSend"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { WaInboxTemplate } from '~/types/whatsapp-inbox'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  templates: WaInboxTemplate[]
  preselect?: WaInboxTemplate | null
}>()

const emit = defineEmits<{
  send: [templateName: string, params: Record<string, string>]
}>()

const selected = ref<WaInboxTemplate | null>(null)
const paramValues = ref<Record<string, string>>({})

const previewText = computed(() => {
  if (!selected.value) return ''
  let text = selected.value.text
  for (const p of selected.value.params) {
    const val = paramValues.value[p]?.trim()
    text = text.replace(new RegExp(`\\{\\{${p}\\}\\}`, 'g'), val || `{{${p}}}`)
  }
  return text
})

const canSend = computed(() => {
  if (!selected.value) return false
  return selected.value.params.every((p) => (paramValues.value[p] ?? '').trim() !== '')
})

function selectTemplate(tpl: WaInboxTemplate) {
  selected.value = tpl
  paramValues.value = {}
}

function updateParam(key: string, val: string) {
  paramValues.value = { ...paramValues.value, [key]: val }
}

function emitSend() {
  if (!selected.value || !canSend.value) return
  emit('send', selected.value.name, { ...paramValues.value })
  open.value = false
  selected.value = null
  paramValues.value = {}
}

function applyPreselect(tpl: WaInboxTemplate | null | undefined) {
  if (!tpl) return
  selected.value = tpl
  paramValues.value = {}
}

watch(open, (v) => {
  if (v) {
    applyPreselect(props.preselect)
    return
  }
  selected.value = null
  paramValues.value = {}
})

watch(() => props.preselect, (tpl) => {
  if (open.value && tpl) {
    applyPreselect(tpl)
  }
})
</script>
