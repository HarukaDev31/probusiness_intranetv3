<template>
  <div
    class="flex h-full min-h-0 flex-1 flex-col overflow-hidden max-lg:-mx-3 max-lg:-mb-3"
  >
    <WhatsappInboxView class="h-full min-h-0 max-h-full" />
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
