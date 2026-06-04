<template>
  <div class="flex min-h-0 flex-1 flex-col max-lg:-mx-3 max-lg:-mb-3 max-lg:h-[calc(100dvh-4.75rem)] max-lg:overflow-hidden">
    <WhatsappInboxView />
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
