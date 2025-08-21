<template>
    <UModal :modelValue="true" @close="$emit('close')">
        <template #header>
            <h2 class="text-xl font-semibold">Crear documento</h2>
        </template>
        <template #body>
            <div class="p-6 space-y-6">


                <div class="space-y-4">
                    <!-- Campo de nombre -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del documento
                        </label>
                        <UInput v-model="documentName" placeholder="Ingrese el nombre del documento"  class="w-full"/>
                    </div>

                    <!-- Uploader -->
                    <div>
                        <FileUploader ref="fileUploaderRef" :multiple="false" @file-added="handleFileAdded"
                            @file-removed="handleFileRemoved" />
                    </div>
                </div>
            </div>
        </template>
        <template #footer>
            <div class="flex justify-end gap-3 mt-6">
                <UButton color="neutral" variant="soft" @click="$emit('close')">
                    Cancelar
                </UButton>
                <UButton color="primary" :disabled="!isValid" @click="handleSave">
                    Guardar
                </UButton>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import FileUploader from './commons/FileUploader.vue'

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'save', data: { name: string, file: File }): void
}>()

const documentName = ref('')
const selectedFile = ref<File | null>(null)
const fileUploaderRef = ref<InstanceType<typeof FileUploader> | null>(null)

// Validación
const isValid = computed(() => {
    return documentName.value.trim() !== '' && selectedFile.value !== null
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
        name: documentName.value,
        file: selectedFile.value
    })
}
</script>
