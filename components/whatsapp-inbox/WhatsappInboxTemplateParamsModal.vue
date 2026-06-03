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

        <UAlert
          v-if="template.header_format === 'VIDEO'"
          color="warning"
          variant="subtle"
          title="Video para WhatsApp"
          :description="templateVideoHeaderHint()"
        />

        <template v-for="def in paramDefs" :key="def.name">
          <UFormField>
            <template #label>
              <span class="inline-flex flex-wrap items-center gap-1.5">
                <span>{{ def.label || def.name }}</span>
                <UBadge
                  :color="paramTypeBadgeColor(def)"
                  variant="subtle"
                  size="xs"
                  :label="paramTypeLabel(def)"
                />
              </span>
            </template>
            <FileUploader
              v-if="def.type === 'file' && template"
              :model-files="filesByParam[def.name] ?? []"
              :accepted-types="acceptedTypesForParam(def, template)"
              :max-file-size="maxFileSizeForParam(def, template)"
              :custom-message="uploadMessageForParam(def, template)"
              :immediate="true"
              :show-save-button="false"
              @files-selected="(list) => onFilesSelected(def, list)"
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

        <div v-if="showDocumentPreview || previewText" class="space-y-2">
          <p class="text-xs font-semibold text-muted">Vista previa en WhatsApp</p>
          <WhatsappInboxDocumentBubble
            v-if="showDocumentPreview"
            :url="previewDocumentUrl || '#'"
            :nombre="previewDocumentName"
            :caption="previewText"
          />
          <UCard
            v-else-if="previewText"
            variant="outline"
            color="info"
            :ui="{ body: 'p-3 text-xs sm:p-3' }"
          >
            <p class="whitespace-pre-wrap text-muted">{{ previewText }}</p>
          </UCard>
        </div>
      </div>
    </template>
    <template #footer>
      <UButton color="neutral" variant="ghost" label="Cancelar" @click="close" />
      <UButton
        color="primary"
        label="Enviar plantilla"
        :disabled="!canSend"
        :loading="sending"
        :label="sending && template?.header_format === 'VIDEO' ? 'Convirtiendo y enviando…' : 'Enviar plantilla'"
        @click="emitSend"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import FileUploader from '~/components/commons/FileUploader.vue'
import WhatsappInboxDocumentBubble from '~/components/whatsapp-inbox/WhatsappInboxDocumentBubble.vue'
import type { WaInboxTemplate, WaInboxTemplateParamDef } from '~/types/whatsapp-inbox'
import {
  acceptedTypesForParam,
  buildTemplatePreview,
  fileMatchesParamKind,
  fileParamsFilled,
  getTemplateParamDefs,
  headerFormatToFileKind,
  maxFileSizeForParam,
  paramTypeBadgeColor,
  paramTypeLabel,
  resolveParamFileKind,
  templateVideoHeaderHint,
  textParamsFilled,
  uploadMessageForParam
} from '~/utils/whatsappInboxTemplateParams'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  template: WaInboxTemplate | null
  sending?: boolean
}>()

const emit = defineEmits<{
  send: [payload: {
    template: WaInboxTemplate
    params: Record<string, string>
    files: Record<string, File>
    fileKinds: Record<string, string>
  }]
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

const showDocumentPreview = computed(() => {
  if (!props.template) return false
  if (headerFormatToFileKind(props.template.header_format) === 'document') return true
  return paramDefs.value.some(
    (d) => d.type === 'file' && resolveParamFileKind(d, props.template!) === 'document'
  )
})

const previewDocumentFile = computed(() => {
  if (!props.template || !showDocumentPreview.value) return null
  const tpl = props.template
  for (const def of paramDefs.value) {
    if (def.type !== 'file' || resolveParamFileKind(def, tpl) !== 'document') continue
    const f = filesByParam.value[def.name]?.[0]
    if (f) return f
  }
  return null
})

const previewDocumentName = computed(
  () => previewDocumentFile.value?.name || 'documento.pdf'
)

const previewDocumentUrl = ref<string | null>(null)

watch(
  previewDocumentFile,
  (file) => {
    if (previewDocumentUrl.value) {
      URL.revokeObjectURL(previewDocumentUrl.value)
      previewDocumentUrl.value = null
    }
    if (file) {
      previewDocumentUrl.value = URL.createObjectURL(file)
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  if (previewDocumentUrl.value) {
    URL.revokeObjectURL(previewDocumentUrl.value)
  }
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

function onFilesSelected(def: WaInboxTemplateParamDef, list: File[]) {
  const tpl = props.template
  if (!tpl) return
  const file = list[0]
  if (file && !fileMatchesParamKind(file, def, tpl)) {
    const kind = resolveParamFileKind(def, tpl)
    emit(
      'error',
      kind === 'video'
        ? 'Solo MP4 compatible con WhatsApp (H.264 + audio AAC).'
        : uploadMessageForParam(def, tpl)
    )
    return
  }
  filesByParam.value = { ...filesByParam.value, [def.name]: list.slice(0, 1) }
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
  const tpl = props.template
  const files: Record<string, File> = {}
  const fileKinds: Record<string, string> = {}
  for (const def of paramDefs.value) {
    if (def.type !== 'file') continue
    const f = filesByParam.value[def.name]?.[0]
    if (!f) continue
    if (!fileMatchesParamKind(f, def, tpl)) {
      emit('error', uploadMessageForParam(def, tpl))
      return
    }
    files[def.name] = f
    fileKinds[def.name] = resolveParamFileKind(def, tpl)
  }
  emit('send', {
    template: tpl,
    params: { ...textValues.value },
    files,
    fileKinds
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
