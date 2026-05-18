<template>
  <UAvatar
    v-if="src"
    :src="src"
    :alt="alt"
    :size="size"
    class="shrink-0 ring-2 ring-default"
  />
  <div
    v-else
    class="flex shrink-0 items-center justify-center rounded-full font-bold text-inverted ring-2 ring-default"
    :class="sizeClass"
    :style="{ background: color }"
  >
    {{ iniciales }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    src?: string | null
    iniciales: string
    color?: string
    alt?: string
    size?: '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  }>(),
  {
    src: null,
    color: '#64748b',
    alt: '',
    size: 'sm'
  }
)

const sizeClass = computed(() => {
  if (props.size === 'md') return 'size-11 text-xs'
  if (props.size === 'xs') return 'size-7 text-[9px]'
  return 'size-8 text-[10px]'
})
</script>
