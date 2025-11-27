<template>
  <div class="mb-2">
    <div class="w-full flex flex-col md:flex-row gap-0 md:gap-4">
      <div class="flex items-center mr-4">
        <UButton
          v-if="!hideBackButton"
          @click="$emit('back')"
          aria-label="Regresar"
          color="neutral"
          variant="outline"
          class="flex items-center gap-2 px-2 py-1 md:px-4 md:py-2 text-sm md:text-base w-fit md:w-auto"
        >
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          <span class=" md:inline whitespace-nowrap">Regresar</span>
        </UButton>

        <!-- Mobile-only small controls inserted next to the back button; styled like the desktop card -->
        <div v-if="$slots['back-extra']" class="ml-2 md:hidden bg-white dark:bg-gray-800 shadow-sm rounded px-3 py-2 flex items-center gap-2">
          <slot name="back-extra" />
        </div>
      </div>
      <div class="flex items-center flex-1" :class="classAdd">
        <div class="flex flex-row items-center gap-4">
          

          <div>
            <h1 class="mt-1 text-base md:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
              <UIcon v-if="icon" :name="icon" class="text-secondary mr-3 text-2xl" />
              {{ title }}
            </h1>
            <p v-if="subtitle" class="mt-1 text-sm text-gray-600 dark:text-gray-300">{{ subtitle }}</p>
          </div>
        
        </div>
        <slot name="actions"></slot>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  icon?: string|null
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