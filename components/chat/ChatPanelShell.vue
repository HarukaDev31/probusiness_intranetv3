<template>
  <UCard
    class="flex min-h-0 flex-col overflow-hidden"
    :class="alturaClase"
    :ui="cardUi"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <div class="relative flex min-h-0 flex-1 flex-col">
      <slot />
    </div>

    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    fullHeight?: boolean
    panelClass?: string
  }>(),
  {
    fullHeight: true,
    panelClass: ''
  }
)

const alturaClase = computed(() => {
  const base = props.fullHeight ? 'min-h-[min(70vh,720px)]' : 'min-h-[320px]'
  return [base, props.panelClass].filter(Boolean).join(' ')
})

const cardUi = {
  root: 'flex min-h-0 flex-col overflow-hidden',
  body: 'flex min-h-0 flex-1 flex-col p-0 sm:p-0',
  header: 'p-0 sm:p-0',
  footer: 'p-0 sm:p-0'
}
</script>
