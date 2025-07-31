<template>
  <!-- Loading Spinner Global -->
  <LoadingSpinner 
    v-if="globalLoading" 
    :full-screen="true" 
    :text="getLoadingMessage()" 
    size="xl" 
  />

  <!-- Success Modal -->
 
</template>

<script setup lang="ts">

import LoadingSpinner from './LoadingSpinner.vue'

const {
  showSuccessModal,
  showErrorModal,
  successConfig,
  errorConfig,
  closeSuccessModal,
  closeErrorModal,
  handleRetry,
  handleSecondaryAction
} = useNotifications()

const {
  globalLoading,
  getLoadingMessage
} = useLoading()
</script> 