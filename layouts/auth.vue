<template>
  <div>
    <slot />
    <!-- Session Expired Modal -->
    <SessionExpiredModal />
  </div>
</template>

<script setup lang="ts">
import SessionExpiredModal from '../components/SessionExpiredModal.vue'
// Layout para páginas de autenticación (login, registro, etc.)
// No incluye sidebar ni header
</script> 