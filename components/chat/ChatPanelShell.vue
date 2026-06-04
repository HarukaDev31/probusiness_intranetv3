<template>
  <UCard
    class="flex h-full min-h-0 flex-col overflow-hidden"
    :class="alturaClase"
    :ui="cardUi"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <div class="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <slot />
    </div>

    <template v-if="$slots.footer" #footer>
      <div class="mt-auto shrink-0">
        <slot name="footer" />
      </div>
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
  root: 'flex h-full min-h-0 flex-col overflow-hidden',
  body: 'flex min-h-0 flex-1 flex-col overflow-hidden p-0 sm:p-0',
  header: 'shrink-0 p-0 sm:p-0',
  footer: 'shrink-0 p-0 sm:p-0'
}
</script>
