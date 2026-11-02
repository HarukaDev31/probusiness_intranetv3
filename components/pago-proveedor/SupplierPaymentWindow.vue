<template>
  <UModal
    :open="open"
    :title="title"
    :description="subtitle || undefined"
    :ui="{
      content: contentClass,
      header: 'border-t-[5px] border-t-primary-500',
      title: 'text-lg font-bold text-gray-900',
      description: 'text-sm text-gray-500'
    }"
    @update:open="onOpen"
  >
    <template v-if="code || $slots.pill" #actions>
      <span v-if="code" class="rounded-lg bg-gray-100 px-2.5 py-1 font-mono text-sm font-bold text-gray-800">{{ code }}</span>
      <slot name="pill" />
    </template>
    <template #body>
      <div class="flex flex-col gap-3.5">
        <slot />
      </div>
    </template>
    <template v-if="$slots.footer || hint" #footer>
      <div class="flex w-full flex-wrap items-center justify-end gap-2">
        <p v-if="hint" class="mr-auto max-w-md text-xs leading-snug text-gray-500">{{ hint }}</p>
        <slot name="footer" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  open: boolean
  title: string
  subtitle?: string
  code?: string | null
  hint?: string
  wide?: boolean
}>(), {
  subtitle: '',
  code: null,
  hint: '',
  wide: false
})

const emit = defineEmits<{ close: [] }>()

const contentClass = computed(() => props.wide ? 'w-full max-w-6xl sm:max-w-6xl' : 'w-full max-w-2xl sm:max-w-2xl')

function onOpen(value: boolean) {
  if (!value) emit('close')
}
</script>
