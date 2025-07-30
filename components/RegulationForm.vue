<template>
  <div class="p-6">
    <!-- Header -->
    <PageHeader 
      :title="title"
      :subtitle="subtitle"
      :icon="icon"
      :loading="isSubmitting"
      @back="goBack"
      @save="handleSave"
    />

    <!-- Loading State -->
    <LoadingState v-if="loading" message="Cargando..." />

    <!-- Error State -->
    <ErrorState 
      v-else-if="error" 
      :message="error"
      @retry="handleRetry"
    />

    <!-- Form -->
    <UCard v-else>
      <div class="space-y-6">
        <slot />
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  subtitle: string
  icon: string
  loading: boolean
  isSubmitting: boolean
  error: string | null
  goBack: () => void
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: []
  retry: []
}>()

// Event handlers
const handleSave = () => {
  emit('save')
}

const handleRetry = () => {
  emit('retry')
}
</script> 