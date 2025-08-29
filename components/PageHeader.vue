<template>
  <div class="">
    <div class="flex items-center justify-between">
      <div class="flex items-center justify-between w-full">
        
        <div class="flex flex-row items-center gap-4">
          <UButton
            v-if="!hideBackButton"
            @click="$emit('back')"
            aria-label="Regresar"
            color="neutral"
            class="py-2"
            variant="outline"
          >
            <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 text-gray-500" />
            <span class="whitespace-nowrap">Regresar</span>
          </UButton>

          <h1 class="mt-3 text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
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
  
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  icon: null,
  loading: false,
  hideBackButton: true
})
defineEmits<{
  back: []
  save: []
}>()
</script> 