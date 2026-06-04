<template>
  <div
    class="flex min-h-0 flex-1 flex-col overflow-hidden max-lg:-mx-3 max-lg:-mb-3 max-lg:h-[calc(100dvh-4.75rem)] lg:h-[calc(100dvh-4.5rem)]"
  >
    <WhatsappInboxView class="h-full min-h-0" />
  </div>
</template>

<script setup lang="ts">
import WhatsappInboxView from '~/components/whatsapp-inbox/WhatsappInboxView/index.vue'

definePageMeta({
  layout: 'default',
  middleware: ['whatsapp-inbox-coordinacion'],
  key: 'whatsapp-inbox'
})
</script>
