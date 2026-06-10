<template>
  <section v-if="conversation" class="flex min-h-0 min-w-0 flex-1 flex-col bg-white dark:bg-gray-900">
    <ChatConversationHeader
      :avatar-text="headerLead.av"
      :title="headerLead.name"
      :subtitle="headerLead.sub"
    >
      <template v-if="!readonly || canAssign" #actions>
        <UBadge
          v-if="conversation.pending_contact"
          color="info"
          variant="subtle"
          size="xs"
        >
          Directorio
        </UBadge>
        <UBadge
          v-else-if="conversation.window_label"
          :color="conversation.window_state === 'open' ? 'success' : 'warning'"
          variant="subtle"
          size="xs"
        >
          {{ conversation.window_label }}
        </UBadge>
        <UButton
          v-if="!readonly"
          icon="i-heroicons-document-text"
          color="neutral"
          variant="ghost"
          size="xs"
          title="Plantillas"
          @click="templatePickerOpen = true"
        />
        <UButton
          v-if="!readonly"
          icon="i-heroicons-arrow-path"
          color="neutral"
          variant="ghost"
          size="xs"
          title="Actualizar"
          @click="emit('refresh')"
        />
        <UPopover
          v-if="!conversation.pending_contact && (!readonly || canAssign)"
          :content="{ side: 'bottom', align: 'end' }"
        >
          <UButton icon="i-heroicons-ellipsis-vertical" color="neutral" variant="ghost" size="xs" aria-label="Más" />
          <template #content>
            <div class="w-56 space-y-3 p-3">
              <div v-if="assignSelectItems.length">
                <p class="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted">Asignar</p>
                <USelectMenu
                  :model-value="conversation.assigned_user_id ?? undefined"
                  :items="assignSelectItems"
                  value-key="value"
                  placeholder="Asignar"
                  size="sm"
                  class="w-full"
                  @update:model-value="(v) => emit('assign', v ?? null)"
                />
              </div>
              <UButton
                v-if="!readonly"
                icon="i-heroicons-pencil-square"
                color="neutral"
                variant="soft"
                size="sm"
                label="Renombrar"
                block
                @click="renameContactOpen = true"
              />
            </div>
          </template>
        </UPopover>
      </template>
    </ChatConversationHeader>

    <div class="flex shrink-0 border-b border-default px-2">
      <UButton
        :color="mainTab === 'wa' ? 'primary' : 'neutral'"
        :variant="mainTab === 'wa' ? 'soft' : 'ghost'"
        size="xs"
        icon="i-heroicons-chat-bubble-left-right"
        label="WhatsApp"
        class="rounded-none"
        @click="emit('update:mainTab', 'wa')"
      />
      <UButton
        :color="mainTab === 'calls' ? 'primary' : 'neutral'"
        :variant="mainTab === 'calls' ? 'soft' : 'ghost'"
        size="xs"
        icon="i-heroicons-phone"
        label="Llamadas"
        class="rounded-none"
        @click="emit('update:mainTab', 'calls')"
      />
    </div>

    <UAlert
      v-if="mainTab === 'wa' && conversation.pending_contact"
      class="m-2 shrink-0"
      color="info"
      variant="subtle"
      icon="i-heroicons-user-plus"
      title="Contacto del directorio"
      :description="originLineText || 'Aún no hay chat en esta línea. Envía una plantilla para iniciar la conversación.'"
    />

    <div
      v-if="mainTab === 'wa' && showSuggestionBar && !conversation.pending_contact"
      class="shrink-0 border-b text-xs transition-shadow duration-500"
      :class="suggestionHighlight ? 'ring-2 ring-inset ring-primary-400/70' : ''"
      :style="{ background: suggestionBanner.cfg.sBg, borderColor: suggestionBanner.cfg.sBrd }"
    >
      <button
        type="button"
        class="flex w-full items-center gap-2 px-3 py-2 text-left"
        @click="suggestionPanelOpen = !suggestionPanelOpen"
      >
        <UIcon name="i-heroicons-sparkles" class="size-3.5 shrink-0" :style="{ color: suggestionBanner.cfg.sLbl }" />
        <span class="min-w-0 flex-1 font-semibold" :style="{ color: suggestionBanner.cfg.sLbl }">
          {{ suggestionBanner.label }}
        </span>
        <span
          v-if="analysisPending"
          class="inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-medium text-primary dark:bg-gray-900/50"
        >
          <UIcon name="i-heroicons-arrow-path" class="size-3 animate-spin" />
          Analizando
        </span>
        <UBadge
          v-else-if="suggestionOptions.length"
          size="xs"
          variant="subtle"
          color="primary"
        >
          {{ suggestionOptions.length }}
        </UBadge>
        <UIcon
          :name="suggestionPanelOpen ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="size-4 shrink-0 text-muted"
        />
      </button>

      <div v-show="suggestionPanelOpen" class="border-t border-default/40 px-3 pb-2 pt-1.5">
        <p v-if="analysisPending && !suggestionOptions.length" class="flex items-center gap-2 py-2 text-[11px] text-muted">
          <UIcon name="i-heroicons-sparkles" class="size-4 animate-pulse text-primary" />
          Copiloto está analizando el último mensaje del cliente…
        </p>
        <template v-else-if="suggestionOptions.length">
          <p class="text-[10px] text-muted">
            Sugerencias para el último mensaje del cliente. Toca una para cargarla en el compositor.
          </p>
          <div v-if="!readonly" class="mt-2 flex flex-col gap-1.5">
            <button
              v-for="option in suggestionOptions"
              :key="option.id"
              type="button"
              class="rounded-lg border px-2.5 py-2 text-left transition"
              :class="selectedSuggestionId === option.id
                ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-400 dark:bg-primary-950/40'
                : 'border-default/80 bg-white/70 hover:border-primary-300 dark:bg-gray-900/40'"
              @click="emit('apply-chip', option)"
            >
              <span class="block text-[10px] font-semibold uppercase text-primary">{{ option.label || 'Sugerencia' }}</span>
              <span class="mt-0.5 block leading-snug text-highlighted">{{ option.text }}</span>
            </button>
          </div>
          <p v-else class="mt-2 text-[11px] leading-snug text-muted">{{ suggestionOptions[0]?.text }}</p>
        </template>
      </div>
    </div>

    <div
      v-else-if="mainTab === 'wa' && conversation.pending_contact && !readonly"
      class="shrink-0 border-b px-3 py-2"
    >
      <UButton
        block
        size="sm"
        color="primary"
        icon="i-heroicons-document-text"
        label="Elegir plantilla para escribir"
        @click="templatePickerOpen = true"
      />
    </div>

    <CopilotoWaChatCore
      v-if="mainTab === 'wa' && !conversation.pending_contact"
      :conversation="conversation"
      :messages="messages"
      :loading-messages="loading"
      :sending-message="sending"
      :readonly="readonly"
      :composer-draft="composerDraft"
      :is-message-analysis-pending="isMessageAnalysisPending"
      @update:composer-draft="emit('update:composerDraft', $event)"
      @send="emit('send-wa', $event)"
      @apply-chip="emit('apply-chip', $event)"
    />

    <div
      v-else-if="mainTab === 'wa' && conversation.pending_contact"
      class="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted"
    >
      Sin mensajes en esta línea todavía.
    </div>

    <div v-else class="flex min-h-0 flex-1 flex-col p-4 text-sm text-muted">
      <UAlert color="info" variant="subtle" icon="i-heroicons-information-circle" title="Llamadas" description="Las grabaciones se capturan desde VoIP al finalizar cada llamada." />
    </div>

    <WhatsappInboxTemplatePickerModal
      v-model:open="templatePickerOpen"
      :templates="templates"
      :loading="loadingTemplates"
      @select="onTemplatePicked"
    />
    <WhatsappInboxTemplateParamsModal
      v-model:open="templateParamsOpen"
      :template="templateForParams"
      :sending="sendingTemplate"
      @send="onTemplateSend"
      @error="(msg) => showModalError('Plantilla', msg)"
    />
    <WhatsappInboxNewContactModal
      v-model:open="newContactOpen"
      :assignable-users="assignableUsers"
      :saving="savingNewContact"
      @save="onNewContactSave"
    />
    <WhatsappInboxRenameContactModal
      v-model:open="renameContactOpen"
      :initial-name="conversation?.contact_name"
      :phone-display="conversation?.phone_display"
      :saving="savingRename"
      @save="onRenameContactSave"
    />
  </section>
  <section v-else class="flex flex-1 items-center justify-center bg-white text-sm text-muted dark:bg-gray-900">
    Selecciona un lead de la cola
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { CopilotoLead } from '~/types/copiloto/lead'
import type { CopilotoMainTab } from '~/composables/copiloto/useCopilotoDashboard'
import type {
  CopilotoSuggestionOption,
  WaCopilotoAssignableUser,
  WaCopilotoComposerSendPayload,
  WaCopilotoConversation,
  WaCopilotoMessage,
  WaCopilotoTemplate
} from '~/types/wa-copiloto'
import { getCopilotoTempConfig } from '~/constants/copiloto/temperature'
import { useModal } from '~/composables/commons/useModal'
import ChatConversationHeader from '~/components/chat/ChatConversationHeader.vue'
import CopilotoWaChatCore from '~/components/copiloto/CopilotoWaChatCore/index.vue'
import WhatsappInboxTemplatePickerModal from '~/components/whatsapp-inbox/WhatsappInboxTemplatePickerModal.vue'
import WhatsappInboxTemplateParamsModal from '~/components/whatsapp-inbox/WhatsappInboxTemplateParamsModal.vue'
import WhatsappInboxNewContactModal from '~/components/whatsapp-inbox/WhatsappInboxNewContactModal.vue'
import WhatsappInboxRenameContactModal from '~/components/whatsapp-inbox/WhatsappInboxRenameContactModal.vue'

const props = withDefaults(
  defineProps<{
    lead: CopilotoLead | null
    conversation: WaCopilotoConversation | null
    messages: WaCopilotoMessage[]
    templates: WaCopilotoTemplate[]
    assignableUsers: WaCopilotoAssignableUser[]
    mainTab: CopilotoMainTab
    readonly?: boolean
    canAssign?: boolean
    loading?: boolean
    loadingTemplates?: boolean
    sending?: boolean
    sendingTemplate?: boolean
    savingNewContact?: boolean
    savingRename?: boolean
    composerDraft?: string
    selectedSuggestionId?: string | null
    suggestionOptions?: CopilotoSuggestionOption[]
    suggestion: { label: string; text: string; cfg: ReturnType<typeof getCopilotoTempConfig> } | null
    analysisPending?: boolean
    isMessageAnalysisPending?: (messageId: number) => boolean
  }>(),
  {
    readonly: false,
    canAssign: false,
    loading: false,
    loadingTemplates: false,
    sending: false,
    sendingTemplate: false,
    savingNewContact: false,
    savingRename: false,
    composerDraft: '',
    selectedSuggestionId: null,
    suggestionOptions: () => [],
    analysisPending: false,
    isMessageAnalysisPending: () => false
  }
)

const emit = defineEmits<{
  'update:mainTab': [tab: CopilotoMainTab]
  'send-wa': [payload: WaCopilotoComposerSendPayload]
  'send-template': [name: string, params: Record<string, string>, files: Record<string, File>, fileKinds: Record<string, string>]
  'create-contact': [payload: { contact_name: string; phone: string; assigned_user_id: number | null }]
  rename: [name: string]
  assign: [userId: number | null]
  'apply-chip': [option: CopilotoSuggestionOption | string]
  'update:composerDraft': [value: string]
  refresh: []
}>()

const suggestionBanner = computed(() => {
  const cfg = props.suggestion?.cfg ?? getCopilotoTempConfig(0)
  return {
    label: props.suggestion?.label ?? 'Copiloto sugiere',
    cfg
  }
})

const suggestionPanelOpen = ref(true)
const suggestionHighlight = ref(false)

const showSuggestionBar = computed(
  () => props.analysisPending || props.suggestionOptions.length > 0
)

const suggestionBannerKey = computed(() =>
  [
    props.analysisPending ? 'pending' : 'ready',
    ...props.suggestionOptions.map((o) => `${o.id}:${o.text}`)
  ].join('|')
)

let highlightTimer: ReturnType<typeof setTimeout> | null = null

watch(suggestionBannerKey, () => {
  suggestionPanelOpen.value = true
  suggestionHighlight.value = true
  if (highlightTimer) clearTimeout(highlightTimer)
  highlightTimer = setTimeout(() => {
    suggestionHighlight.value = false
    highlightTimer = null
  }, 2200)
})

watch(
  () => props.analysisPending,
  (pending) => {
    if (pending) suggestionPanelOpen.value = true
  }
)

const { showError: showModalError } = useModal()

const templatePickerOpen = ref(false)
const templateParamsOpen = ref(false)
const templateForParams = ref<WaCopilotoTemplate | null>(null)
const newContactOpen = ref(false)
const renameContactOpen = ref(false)

const assignSelectItems = computed(() =>
  props.assignableUsers.map((u) => ({ label: u.name, value: u.id }))
)

const headerLead = computed(() => {
  if (props.lead) return props.lead
  const conv = props.conversation
  if (!conv) {
    return { av: 'LD', name: 'Lead', sub: '' }
  }
  const name = String(conv.contact_name ?? conv.phone_display ?? conv.phone_e164 ?? '').trim() || 'Lead'
  const words = name.split(/\s+/).filter(Boolean)
  const av = words.length === 1
    ? words[0].slice(0, 2).toUpperCase()
    : `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}`.toUpperCase()
  return {
    av: av || 'LD',
    name,
    sub: conv.channel_label || 'WhatsApp'
  }
})

const originLineText = computed(() => {
  const conv = props.conversation
  if (!conv?.origin_line_number) return ''
  const label = conv.origin_line_label || 'línea'
  return `Primer registro desde ${label} (${conv.origin_line_number}). Aún no hay chat en esta línea — envía una plantilla para iniciar.`
})

function onTemplatePicked(t: WaCopilotoTemplate) {
  templateForParams.value = t
  templateParamsOpen.value = true
}

function onTemplateSend(payload: {
  params: Record<string, string>
  files: Record<string, File>
  fileKinds: Record<string, string>
}) {
  const name = templateForParams.value?.name
  if (!name) return
  emit('send-template', name, payload.params, payload.files, payload.fileKinds)
  templateParamsOpen.value = false
}

async function onNewContactSave(payload: {
  contact_name: string
  phone: string
  assigned_user_id: number | null
}) {
  emit('create-contact', payload)
  newContactOpen.value = false
}

async function onRenameContactSave(name: string) {
  emit('rename', name)
  renameContactOpen.value = false
}

defineExpose({ openNewContact: () => { newContactOpen.value = true } })
</script>
