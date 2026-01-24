<template>
    <UModal>
        <template #header>
            <h2 class="text-xl font-semibold">Crear Viático</h2>
        </template>
        <template #body>
            <div class="p-6 space-y-6">
                <div class="space-y-4">
                    <!-- Asunto -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Asunto <span class="text-red-500">*</span>
                        </label>
                        <UInput v-model="formData.subject" placeholder="Ej: Solicitud de reintegro de viáticos" class="w-full"/>
                    </div>

                    <!-- Fecha de Reintegro -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Fecha de Reintegro <span class="text-red-500">*</span>
                        </label>
                        <UInput v-model="formData.reimbursement_date" type="date" class="w-full"/>
                    </div>

                    <!-- Área Solicitante -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Área Solicitante <span class="text-red-500">*</span>
                        </label>
                        <UInput v-model="formData.requesting_area" placeholder="Ej: Importación" class="w-full"/>
                    </div>

                    <!-- Descripción del Gasto -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Descripción del Gasto <span class="text-red-500">*</span>
                        </label>
                        <UTextarea v-model="formData.expense_description" placeholder="Ej: Apoyo entregas provincia carga # 20" class="w-full" rows="3"/>
                    </div>

                    <!-- Monto Total -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Monto Total (S/) <span class="text-red-500">*</span>
                        </label>
                        <UInput v-model.number="formData.total_amount" type="number" step="0.01" min="0" placeholder="0.00" class="w-full">
                            <template #leading>
                                <span class="text-gray-500">S/</span>
                            </template>
                        </UInput>
                    </div>

                    <!-- Uploader -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Comprobante (Imagen)
                        </label>
                        <FileUploader 
                            ref="fileUploaderRef" 
                            :multiple="false" 
                            :accepted-types="['.jpg', '.jpeg', '.png', '.gif']"
                            @file-added="handleFileAdded"
                            @file-removed="handleFileRemoved" 
                            :show-save-button="false"
                        />
                    </div>
                </div>
            </div>
        </template>
        <template #footer="{ close }">
            <div class="flex justify-end gap-3 mt-6">
                <UButton color="neutral" variant="soft" @click="close">
                    Cancelar
                </UButton>
                <UButton color="primary" :disabled="!isValid" :loading="loading" @click="handleSave(close)">
                    Guardar
                </UButton>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import FileUploader from '~/components/commons/FileUploader.vue'
import type { CreateViaticoRequest } from '~/types/viatico'

interface Props {
    onClose?: () => void
    onSave?: (data: CreateViaticoRequest) => void
}

const props = defineProps<Props>()

const loading = ref(false)
const selectedFile = ref<File | null>(null)
const fileUploaderRef = ref<InstanceType<typeof FileUploader> | null>(null)

const formData = ref<CreateViaticoRequest>({
    subject: '',
    reimbursement_date: '',
    requesting_area: '',
    expense_description: '',
    total_amount: 0,
    receipt_file: null
})

// Validación
const isValid = computed(() => {
    return formData.value.subject.trim() !== '' &&
           formData.value.reimbursement_date !== '' &&
           formData.value.requesting_area.trim() !== '' &&
           formData.value.expense_description.trim() !== '' &&
           formData.value.total_amount > 0
})

// Manejadores de eventos
const handleFileAdded = (file: File) => {
    selectedFile.value = file
    formData.value.receipt_file = file
}

const handleFileRemoved = () => {
    selectedFile.value = null
    formData.value.receipt_file = null
}

const handleSave = (close: () => void) => {
    if (!isValid.value) return
    
    if (props.onSave) {
        props.onSave({
            ...formData.value,
            receipt_file: selectedFile.value
        })
        close()
    }
}
</script>
