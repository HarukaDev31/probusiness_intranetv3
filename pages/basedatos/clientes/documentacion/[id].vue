<template>
  <ClienteDocumentacion :cliente-id="proveedorId" :edit="false" />
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

// Route params
const route = useRoute()
const proveedorId = route.params.id as string
</script>
