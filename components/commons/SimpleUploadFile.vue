<template>
    <UModal :modelValue="true" @close="$emit('close')">
        <template #header>
            <h2 class="text-xl font-semibold">{{ props.title }}</h2>
        </template>
        <template #body>
            <div class="p-6 space-y-6">


                <div class="space-y-4">


                    <!-- Uploader -->
                    <div>
                        <FileUploader ref="fileUploaderRef" :multiple="false" @file-added="handleFileAdded"
                            @file-removed="handleFileRemoved" />
                    </div>
                </div>
            </div>
        </template>
        <template #footer="{ close }">
            <div class="flex justify-end gap-3 mt-6">
                <UButton color="neutral" variant="soft" @click="$emit('close')">
                    Cancelar
                </UButton>
                <UButton color="primary" :disabled="!isValid" @click="() => {
                    handleSave()
                    $emit('close')
                }">
                    Guardar
                </UButton>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import FileUploader from '~/components/commons/FileUploader.vue'

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'save', data: { file: File }): void
}>()

const props = defineProps<{
    title: string
}>()
const selectedFile = ref<File | null>(null)
const fileUploaderRef = ref<InstanceType<typeof FileUploader> | null>(null)

// Validación
const isValid = computed(() => {
    return selectedFile.value !== null
})

// Manejadores de eventos
const handleFileAdded = (file: File) => {
    selectedFile.value = file
}

const handleFileRemoved = () => {
    selectedFile.value = null
}

const handleSave = () => {
    if (!isValid.value || !selectedFile.value) return

    emit('save', {
        file: selectedFile.value
    })
    emit('close')
}
</script>
