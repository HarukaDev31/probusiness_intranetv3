<template>
  <div class="p-2 md:p-4">
    <WhatsappInboxView />
  </div>
</template>

<script setup lang="ts">
import WhatsappInboxView from '~/components/whatsapp-inbox/WhatsappInboxView/index.vue'

definePageMeta({
  layout: 'default',
  middleware: ['whatsapp-inbox-coordinacion']
})
</script>
