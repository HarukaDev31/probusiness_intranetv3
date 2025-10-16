<template>
  <div class="mb-2">
    <div class="w-full flex gap-4">
      <UButton
            v-if="!hideBackButton"
            @click="$emit('back')"
            aria-label="Regresar"
            color="neutral"
            class="flex"
            size="xl"
            variant="outline"
          >
            <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 text-gray-500" />
            <span class="whitespace-nowrap">Regresar</span>
          </UButton>
      <div class="flex items-center flex-1" :class="classAdd">
        <div class="flex flex-row items-center gap-4">
          

          <h1 class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
            <UIcon v-if="icon" :name="icon" class="text-secondary mr-3 text-2xl" />
            {{ title }}
          </h1>
        
        </div>
        <slot name="actions"></slot>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  subtitle: string
  icon: string|null
  loading?: boolean
  hideBackButton?: boolean
  classAdd?: string
  
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  icon: null,
  loading: false,
  hideBackButton: true,
  classAdd: 'justify-between',
})
defineEmits<{
  back: []
  save: []
}>()
</script> 