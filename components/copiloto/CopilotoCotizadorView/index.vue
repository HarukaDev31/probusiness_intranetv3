<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden md:p-4">
    <PageHeader title="Copiloto IA" :subtitle="headerSubtitle" icon="i-heroicons-sparkles" :hide-back-button="true" />

    <div class="grid min-h-0 flex-1 overflow-hidden rounded-lg border border-default bg-[#f0f4f9] dark:bg-gray-950 md:grid-cols-[minmax(260px,280px)_1fr_minmax(240px,272px)]">
      <CopilotoLeadQueue
        title="Mi cola"
        v-model:search="queueSearch"
        :leads="leads"
        :conversations="queueConversations"
        :loading="loadingLeads"
        :selected-index="Math.max(selectedLeadIndex, 0)"
        @select="selectLead"
        @new-contact="newContactOpen = true"
        @sync="onRefresh"
      />
      <CopilotoConversationPanel
        :key="selectedConversation?.contact_id ? `ct-${selectedConversation.contact_id}` : (selectedConversation?.id ?? selectedLead?.id ?? 'none')"
        :lead="selectedLead"
        :conversation="selectedConversation"
        :messages="waMessages"
        :templates="templates"
        :assignable-users="assignableUsers"
        :loading="loadingConversation"
        :loading-templates="loadingTemplates"
        :sending="sendingMessage"
        :sending-template="sendingTemplate"
        :saving-new-contact="savingNewContact"
        :saving-rename="savingRename"
        :main-tab="mainTab"
        :suggestion="suggestion"
        :suggestion-options="suggestionOptions"
        :selected-suggestion-id="selectedSuggestionId"
        :composer-draft="composerDraft"
        @update:composer-draft="setComposerDraft"
        @update:main-tab="setMainTab"
        @send-wa="sendWaMessage"
        @send-template="onSendTemplate"
        @create-contact="onCreateContact"
        @rename="onRename"
        @assign="onAssign"
        @apply-chip="applySuggestionChip"
        @refresh="onRefresh"
      />
      <CopilotoLeadFicha
        :key="`ficha-${selectedLead?.id ?? 'none'}`"
        :lead="selectedLead"
        :ficha-tab="fichaTab"
        :suggestion-logs="suggestionLogs"
        @update:ficha-tab="setFichaTab"
      />
    </div>

    <WhatsappInboxNewContactModal
      v-model:open="newContactOpen"
      :assignable-users="assignableUsers"
      :saving="savingNewContact"
      @save="onCreateContact"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '~/components/PageHeader.vue'
import CopilotoLeadQueue from '~/components/copiloto/CopilotoLeadQueue/index.vue'
import CopilotoConversationPanel from '~/components/copiloto/CopilotoConversationPanel/index.vue'
import CopilotoLeadFicha from '~/components/copiloto/CopilotoLeadFicha/index.vue'
import WhatsappInboxNewContactModal from '~/components/whatsapp-inbox/WhatsappInboxNewContactModal.vue'
import { useCopilotoDashboard } from '~/composables/copiloto/useCopilotoDashboard'
import { useUserRole } from '~/composables/auth/useUserRole'
import { setContentNarrow } from '~/composables/usePageLayout'

const { userData } = useUserRole()
const newContactOpen = ref(false)

const {
  leads,
  queueConversations,
  selectedLeadIndex,
  selectedLead,
  selectedConversation,
  waMessages,
  templates,
  assignableUsers,
  mainTab,
  fichaTab,
  loadingConversation,
  loadingLeads,
  queueSearch,
  loadingTemplates,
  sendingMessage,
  sendingTemplate,
  savingNewContact,
  savingRename,
  suggestion,
  suggestionOptions,
  selectedSuggestionId,
  composerDraft,
  suggestionLogs,
  selectLead,
  setMainTab,
  setFichaTab,
  sendWaMessage,
  sendTemplateMessage,
  createManualContact,
  renameConversation,
  assignConversation,
  applySuggestionChip,
  setComposerDraft,
  refreshLeads,
  syncContacts
} = useCopilotoDashboard({ readonly: false })

const headerSubtitle = computed(() => {
  const name = userData.value?.nombre || 'Cotizador'
  const line = selectedConversation.value?.phone_display
  return line ? `Cola de atención · ${name} · ${line}` : `Cola de atención · ${name}`
})

async function onRefresh() {
  await syncContacts()
  await refreshLeads()
}

async function onSendTemplate(
  name: string,
  params: Record<string, string>,
  files: Record<string, File>,
  fileKinds: Record<string, string>
) {
  await sendTemplateMessage(name, params, files, fileKinds)
}

async function onCreateContact(payload: {
  contact_name: string
  phone: string
  assigned_user_id: number | null
}) {
  await createManualContact(payload)
  newContactOpen.value = false
}

async function onRename(name: string) {
  await renameConversation(name)
}

async function onAssign(userId: number | null) {
  await assignConversation(userId)
}

onMounted(() => {
  setContentNarrow(false)
})
</script>
