<template>
    <UModal :modelValue="true" @close="$emit('close')">
        <template #header>
            <h2 class="text-xl font-semibold">{{ title }}</h2>
        </template>
        
        <template #body>
            <div class="p-6">
                <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ content }}</p>
            </div>
        </template>
        
        <template #footer>
            <div class="flex justify-end">
                <UButton 
                    label="Cerrar" 
                    color="neutral" 
                    variant="ghost" 
                    @click="$emit('close')" 
                />
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
defineProps<{
    title: string
    content: string
}>()

defineEmits<{
    close: []
}>()
</script>
