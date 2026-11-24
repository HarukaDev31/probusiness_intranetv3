<template>
  <UPopover mode="hover" :open-delay="0" :close-delay="0" :content="{ side: 'bottom', align: 'center' }" :ui="{ content: 'bg-transparent shadow-none ring-0' }">
    <span class="cc-info" tabindex="0" aria-label="Información">i</span>
    <template #content>
      <div class="cc cc-tip"><span v-for="row in CHINA_INFO[topic]" :key="row[0]"><strong>{{ row[0] }}</strong> {{ row[1] }}</span></div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import { CHINA_INFO } from '~/constants/chinaCajaInfo'

defineProps<{ topic: string }>()
</script>
