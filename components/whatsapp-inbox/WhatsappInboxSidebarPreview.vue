<template>
  <span class="flex min-w-0 items-center gap-1 truncate text-xs text-muted">
    <span
      v-if="meta.showTicks"
      class="shrink-0 text-[11px] leading-none"
      :class="meta.tickClass"
      aria-hidden="true"
    >{{ meta.tickSymbol }}</span>
    <UIcon
      v-if="meta.showMediaIcon && meta.icon"
      :name="meta.icon"
      class="size-3.5 shrink-0 opacity-80"
      aria-hidden="true"
    />
    <span class="truncate">{{ meta.label }}</span>
  </span>
</template>

<script setup lang="ts">
import type { WaInboxConversation } from '~/types/whatsapp-inbox'
import { getWaInboxSidebarPreviewMeta } from '~/utils/whatsappInboxSidebarPreview'

const props = defineProps<{
  conversation: WaInboxConversation
}>()

const meta = computed(() => getWaInboxSidebarPreviewMeta(props.conversation))
</script>
