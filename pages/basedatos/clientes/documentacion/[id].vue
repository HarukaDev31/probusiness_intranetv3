<template>
  <ClienteDocumentacion :cliente-id="clienteId" :edit="false" />
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

// Route params
const route = useRoute()
const clienteId = route.params.id as string
</script>
