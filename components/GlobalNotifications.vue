<template>
  <!-- Loading Spinner Global -->
  <LoadingSpinner 
    v-if="globalLoading" 
    :full-screen="true" 
    :text="getLoadingMessage()" 
    size="xl" 
  />

  <!-- Success Modal -->
  <SuccessModal
    :is-open="showSuccessModal"
    :title="successConfig.title"
    :subtitle="successConfig.subtitle"
    :message="successConfig.message"
    :details="successConfig.details"
    :show-secondary-button="successConfig.showSecondaryButton"
    :secondary-button-text="successConfig.secondaryButtonText"
    @close="closeSuccessModal"
    @secondary-action="handleSecondaryAction"
  />

  <!-- Error Modal -->
  <ErrorModal
    :is-open="showErrorModal"
    :title="errorConfig.title"
    :subtitle="errorConfig.subtitle"
    :message="errorConfig.message"
    :details="errorConfig.details"
    :show-retry-button="errorConfig.showRetryButton"
    @close="closeErrorModal"
    @retry="handleRetry"
  />
</template>

<script setup lang="ts">

import LoadingSpinner from './LoadingSpinner.vue'
import SuccessModal from './SuccessModal.vue'
import ErrorModal from './ErrorModal.vue'

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