<template>
  <div class="flex shrink-0 gap-1 rounded-lg border border-default bg-white p-1 dark:bg-gray-900">
    <UButton
      size="xs"
      :variant="isPipeline ? 'soft' : 'ghost'"
      :color="isPipeline ? 'primary' : 'neutral'"
      icon="i-heroicons-view-columns"
      label="Pipeline"
      class="flex-1"
      :to="pipelinePath"
    />
    <UButton
      size="xs"
      :variant="!isPipeline ? 'soft' : 'ghost'"
      :color="!isPipeline ? 'primary' : 'neutral'"
      icon="i-heroicons-chat-bubble-left-right"
      :label="colaLabel"
      class="flex-1"
      :to="colaPath"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  copilotoConversationPath,
  copilotoListPath,
  copilotoPipelinePath,
  type CopilotoRouteScope
} from '~/utils/copilotoRoute'

const props = withDefaults(
  defineProps<{
    scope: CopilotoRouteScope
    isPipeline: boolean
    conversationId?: number | null
    colaLabel?: string
  }>(),
  {
    conversationId: null,
    colaLabel: 'Mi cola'
  }
)

const pipelinePath = computed(() => copilotoPipelinePath(props.scope))
const colaPath = computed(() => {
  if (props.conversationId && props.conversationId > 0) {
    return copilotoConversationPath(props.scope, props.conversationId)
  }
  return copilotoListPath(props.scope)
})
</script>
