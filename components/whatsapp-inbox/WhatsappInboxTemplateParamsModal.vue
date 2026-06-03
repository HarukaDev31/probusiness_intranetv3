<template>
  <UModal
    v-model:open="open"
    :title="template ? (template.label || template.name) : 'Parámetros'"
    :ui="{ width: 'sm:max-w-lg' }"
  >
    <template #body>
      <div v-if="template" class="max-h-[65vh] space-y-4 overflow-y-auto">
        <UCard variant="subtle" :ui="{ body: 'p-3 text-xs text-muted sm:p-3' }">
          <p class="whitespace-pre-wrap">{{ template.text }}</p>
        </UCard>

        <template v-for="def in paramDefs" :key="def.name">
          <UFormField :label="def.label || def.name">
            <FileUploader
              v-if="def.type === 'file'"
              :model-files="filesByParam[def.name] ?? []"
              :accepted-types="acceptedTypesForParam(def)"
              :custom-message="`Sube el archivo para {{${def.name}}}`"
              :immediate="true"
              :show-save-button="false"
              @files-selected="(list) => setFiles(def.name, list)"
              @file-removed="() => clearFiles(def.name)"
              @error="onUploaderError"
            />
            <UInput
              v-else
              :model-value="textValues[def.name] ?? ''"
              :placeholder="`Valor para {{${def.name}}}`"
              @update:model-value="(v) => setText(def.name, String(v ?? ''))"
            />
          </UFormField>
        </template>

        <p v-if="!paramDefs.length" class="text-sm text-muted">
          Esta plantilla no requiere parámetros.
        </p>

        <UCard v-if="previewText" variant="outline" color="info" :ui="{ body: 'p-3 text-xs sm:p-3' }">
          <p class="mb-1 font-semibold text-info">Vista previa</p>
          <p class="whitespace-pre-wrap text-muted">{{ previewText }}</p>
        </UCard>
      </div>
    </template>
    <template #footer>
      <UButton color="neutral" variant="ghost" label="Cancelar" @click="close" />
      <UButton
        color="primary"
        label="Enviar plantilla"
        :disabled="!canSend"
        :loading="sending"
        @click="emitSend"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import FileUploader from '~/components/commons/FileUploader.vue'
import type { WaInboxTemplate } from '~/types/whatsapp-inbox'
import {
  acceptedTypesForParam,
  buildTemplatePreview,
  fileParamsFilled,
  getTemplateParamDefs,
  textParamsFilled
} from '~/utils/whatsappInboxTemplateParams'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  template: WaInboxTemplate | null
  sending?: boolean
}>()

const emit = defineEmits<{
  send: [payload: { template: WaInboxTemplate; params: Record<string, string>; files: Record<string, File> }]
  error: [message: string]
}>()

const textValues = ref<Record<string, string>>({})
const filesByParam = ref<Record<string, File[]>>({})

const paramDefs = computed(() =>
  props.template ? getTemplateParamDefs(props.template) : []
)

const previewText = computed(() => {
  if (!props.template) return ''
  return buildTemplatePreview(props.template.text, paramDefs.value, textValues.value)
})

const canSend = computed(() => {
  if (!props.template) return false
  const defs = paramDefs.value
  if (!defs.length) return true
  return textParamsFilled(defs, textValues.value) && fileParamsFilled(defs, filesByParam.value)
})

function setText(name: string, val: string) {
  textValues.value = { ...textValues.value, [name]: val }
}

function setFiles(name: string, list: File[]) {
  filesByParam.value = { ...filesByParam.value, [name]: list.slice(0, 1) }
}

function clearFiles(name: string) {
  const next = { ...filesByParam.value }
  delete next[name]
  filesByParam.value = next
}

function onUploaderError(message: string) {
  emit('error', message)
}

function resetForm() {
  textValues.value = {}
  filesByParam.value = {}
}

function close() {
  open.value = false
}

function emitSend() {
  if (!props.template || !canSend.value) return
  const files: Record<string, File> = {}
  for (const def of paramDefs.value) {
    if (def.type !== 'file') continue
    const f = filesByParam.value[def.name]?.[0]
    if (f) files[def.name] = f
  }
  emit('send', {
    template: props.template,
    params: { ...textValues.value },
    files
  })
}

watch(open, (v) => {
  if (!v) {
    resetForm()
  }
})

watch(() => props.template, () => {
  resetForm()
})
</script>
