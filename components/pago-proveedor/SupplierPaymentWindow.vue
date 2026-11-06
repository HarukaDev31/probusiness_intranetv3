<template>
  <UModal
    :open="open"
    :title="title"
    :description="subtitle || undefined"
    :dismissible="false"
    :ui="{
      content: contentClass,
      header: 'border-t-[5px] border-t-primary-500',
      title: 'text-lg font-bold text-highlighted',
      description: 'text-sm text-muted'
    }"
    @update:open="onOpen"
  >
    <template v-if="code || $slots.pill" #actions>
      <UBadge v-if="code" color="neutral" variant="subtle" class="font-mono text-sm font-bold">{{ code }}</UBadge>
      <slot name="pill" />
    </template>
    <template #body>
      <div class="flex flex-col gap-3.5">
        <slot />
      </div>
    </template>
    <template v-if="$slots.footer || hint" #footer>
      <div class="flex w-full flex-wrap items-center justify-end gap-2">
        <p v-if="hint" class="mr-auto max-w-md text-xs leading-snug text-muted">{{ hint }}</p>
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
  widthClass?: string
}>(), {
  subtitle: '',
  code: null,
  hint: '',
  wide: false,
  widthClass: ''
})

const emit = defineEmits<{ close: [] }>()

const contentClass = computed(() => {
  if (props.widthClass) return `w-full ${props.widthClass}`
  return props.wide ? 'w-full max-w-6xl sm:max-w-6xl' : 'w-full max-w-2xl sm:max-w-2xl'
})

function onOpen(value: boolean) {
  if (!value) emit('close')
}
</script>
